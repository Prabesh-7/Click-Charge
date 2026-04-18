

import os
import secrets
import time
from datetime import datetime, timedelta, timezone
import httpx
from google.oauth2 import id_token

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.stations import Station
from app.models.chargers import Charger, ChargerStatus
from app.schemas.userValidation import UserCreate, UserOut
from sqlalchemy.future import select
from sqlalchemy import func, cast
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from jose import JWTError
from geoalchemy2 import Geography
from app.schemas.userValidation import UserLogin, ForgotPasswordRequest, VerifyResetOtpRequest, ResetPasswordRequest
from app.schemas.userValidation import UserProfileUpdate
from app.utils.jwt import create_access_token, create_password_reset_session_token, decode_password_reset_session_token
from app.schemas.userValidation import TokenData
from app.schemas.user_station import UserStationOut, UserStationChargerOut, UserStationConnectorOut
from app.services.station_review_service import get_station_review_aggregates
from app.services.notification_service import EmailDeliveryError, send_password_reset_otp_email
from app.utils.security import hash_password, verify_password


PASSWORD_RESET_OTP_EXPIRY_MINUTES = int(os.getenv("PASSWORD_RESET_OTP_EXPIRY_MINUTES", "10"))
GOOGLE_CLIENT_ID = "484650375398-vrispacn1a9581b5sc9d2r4bqh7qvfjh.apps.googleusercontent.com"


def _generate_password_reset_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


async def _verify_google_token_via_tokeninfo(credential: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    token_info = response.json()

    aud = str(token_info.get("aud") or "")
    iss = str(token_info.get("iss") or "")
    exp_raw = token_info.get("exp")
    email = token_info.get("email")
    email_verified = token_info.get("email_verified")

    try:
        exp = int(str(exp_raw))
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid Google token") from exc

    if aud != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Invalid Google audience")

    if iss not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Invalid Google issuer")

    if exp <= int(time.time()):
        raise HTTPException(status_code=401, detail="Expired Google token")

    if not email or str(email_verified).lower() != "true":
        raise HTTPException(status_code=401, detail="Google account email is not verified")

    return token_info


async def login_user(user: UserLogin, db: AsyncSession):

    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    db_user = result.scalar_one_or_none()
    

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user.password, db_user.password):
        if db_user.password != user.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        db_user.password = hash_password(user.password)
        await db.commit()
        await db.refresh(db_user)

    token_data = TokenData(
        user_id=db_user.user_id,
        email=db_user.email,
        role=db_user.role
    )

    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(db_user)  # ← clean, single line
    }


async def login_user_with_google(credential: str, db: AsyncSession):
    try:
        from google.auth.transport import requests as google_requests

        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ImportError:
        id_info = await _verify_google_token_via_tokeninfo(credential)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google token") from exc

    email = id_info.get("email")
    email_verified = id_info.get("email_verified")
    if not email or not email_verified:
        raise HTTPException(status_code=401, detail="Google account email is not verified")

    result = await db.execute(select(User).where(User.email == email))
    db_user = result.scalar_one_or_none()

    if not db_user:
        display_name = str(id_info.get("name") or email.split("@")[0]).strip()[:100]
        db_user = User(
            user_name=display_name or "Google User",
            email=email,
            password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)

    token_data = TokenData(
        user_id=db_user.user_id,
        email=db_user.email,
        role=db_user.role,
    )
    access_token = create_access_token(token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(db_user),
    }


async def register_user(user: UserCreate, db: AsyncSession):

    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        user_name=user.user_name,
        email=user.email,
        password=hash_password(user.password),
        phone_number=user.phone_number,
        vehicle=user.vehicle
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


async def request_password_reset(payload: ForgotPasswordRequest, db: AsyncSession) -> dict:
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    db_user = result.scalar_one_or_none()

    if not db_user:
        return {"message": "If an account exists for that email, a reset code has been sent."}

    otp = _generate_password_reset_otp()
    db_user.password_reset_otp_hash = hash_password(otp)
    db_user.password_reset_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=PASSWORD_RESET_OTP_EXPIRY_MINUTES)

    await db.commit()

    try:
        await send_password_reset_otp_email(
            recipient_email=db_user.email,
            recipient_name=db_user.user_name,
            otp=otp,
            expiry_minutes=PASSWORD_RESET_OTP_EXPIRY_MINUTES,
        )
    except EmailDeliveryError as exc:
        db_user.password_reset_otp_hash = None
        db_user.password_reset_otp_expires_at = None
        await db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"message": "If an account exists for that email, a reset code has been sent."}


async def verify_password_reset_otp(payload: VerifyResetOtpRequest, db: AsyncSession) -> dict:
    result = await db.execute(
        select(User).where(User.email == payload.email)
    )
    db_user = result.scalar_one_or_none()

    if not db_user or not db_user.password_reset_otp_hash or not db_user.password_reset_otp_expires_at:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset code")

    if db_user.password_reset_otp_expires_at < datetime.now(timezone.utc):
        db_user.password_reset_otp_hash = None
        db_user.password_reset_otp_expires_at = None
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid or expired password reset code")

    if not verify_password(payload.otp, db_user.password_reset_otp_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired password reset code")

    db_user.password_reset_otp_hash = None
    db_user.password_reset_otp_expires_at = None
    await db.commit()

    reset_token = create_password_reset_session_token(db_user.email)

    return {
        "message": "OTP verified successfully",
        "reset_token": reset_token,
    }


async def reset_password(payload: ResetPasswordRequest, db: AsyncSession) -> dict:
    try:
        email = decode_password_reset_session_token(payload.reset_token)
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset session")

    result = await db.execute(
        select(User).where(User.email == email)
    )
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.password = hash_password(payload.new_password)
    await db.commit()
    await db.refresh(db_user)

    return {"message": "Password reset successfully"}


async def get_available_stations_for_user(
    db: AsyncSession,
    current_user_id: int | None = None,
    radius_km: int | None = None,
    user_latitude: float | None = None,
    user_longitude: float | None = None,
) -> list[UserStationOut]:
    station_columns = [
        Station.station_id,
        Station.station_name,
        Station.address,
        func.ST_X(Station.location).label("longitude"),
        func.ST_Y(Station.location).label("latitude"),
        Station.station_description,
        Station.phone_number,
        Station.has_wifi,
        Station.has_parking,
        Station.has_food,
        Station.has_coffee,
        Station.has_bedroom,
        Station.has_restroom,
        Station.station_images,
        Station.created_at,
    ]

    station_query = select(*station_columns)

    has_any_location = user_latitude is not None or user_longitude is not None
    has_full_location = user_latitude is not None and user_longitude is not None

    if has_any_location and not has_full_location:
        raise HTTPException(
            status_code=422,
            detail="Both user_latitude and user_longitude are required when providing location",
        )

    if radius_km is not None and not has_full_location:
        raise HTTPException(
            status_code=422,
            detail="user_latitude and user_longitude are required when radius_km is provided",
        )

    if has_full_location:
        station_geography = cast(Station.location, Geography)
        user_point_geography = cast(
            func.ST_SetSRID(func.ST_MakePoint(user_longitude, user_latitude), 4326),
            Geography,
        )

        station_query = station_query.add_columns(
            func.ST_Distance(station_geography, user_point_geography).label("distance_meters")
        )

        if radius_km is not None:
            radius_meters = radius_km * 1000
            station_query = station_query.where(
                func.ST_DWithin(station_geography, user_point_geography, radius_meters)
            )

        station_query = station_query.order_by(
            func.ST_Distance(station_geography, user_point_geography).asc(),
            Station.created_at.desc(),
        )
    else:
        station_query = station_query.order_by(Station.created_at.desc())

    station_result = await db.execute(station_query)

    stations = station_result.mappings().all()
    if not stations:
        return []

    station_ids = [station["station_id"] for station in stations]

    aggregate_map, my_rating_map = await get_station_review_aggregates(station_ids, current_user_id, db)

    charger_result = await db.execute(
        select(Charger)
        .options(selectinload(Charger.connectors))
        .where(Charger.station_id.in_(station_ids))
        .order_by(Charger.created_at.desc())
    )
    chargers = charger_result.scalars().all()

    station_chargers: dict[int, list[Charger]] = {station_id: [] for station_id in station_ids}
    for charger in chargers:
        station_chargers.setdefault(charger.station_id, []).append(charger)

    station_out: list[UserStationOut] = []

    for station in stations:
        station_id = station["station_id"]
        chargers_for_station = station_chargers.get(station_id, [])

        total_chargers = len(chargers_for_station)
        total_connectors = 0
        available_connectors = 0
        available_chargers = 0
        charger_types: set[str] = set()
        chargers_out: list[UserStationChargerOut] = []

        for charger in chargers_for_station:
            connectors = list(charger.connectors or [])
            connector_items: list[UserStationConnectorOut] = []

            charger_total_connectors = len(connectors)
            charger_available_connectors = 0

            for connector in connectors:
                connector_status = str(connector.status.value if hasattr(connector.status, "value") else connector.status)
                if connector.status == ChargerStatus.AVAILABLE:
                    charger_available_connectors += 1

                connector_items.append(
                    UserStationConnectorOut(
                        connector_id=connector.connector_id,
                        connector_number=connector.connector_number,
                        status=connector_status,
                        current_transaction_id=connector.current_transaction_id,
                        reserved_by_user_id=connector.reserved_by_user_id,
                        reserved_at=connector.reserved_at,
                    )
                )

            if charger_total_connectors == 0:
                # Fallback for old rows without connectors.
                charger_total_connectors = 1
                if charger.status == ChargerStatus.AVAILABLE:
                    charger_available_connectors = 1

            total_connectors += charger_total_connectors
            available_connectors += charger_available_connectors
            if charger_available_connectors > 0:
                available_chargers += 1

            charger_type = str(charger.type.value if hasattr(charger.type, "value") else charger.type)
            charger_types.add(charger_type)

            chargers_out.append(
                UserStationChargerOut(
                    charger_id=charger.charger_id,
                    name=charger.name,
                    type=charger_type,
                    status=str(charger.status.value if hasattr(charger.status, "value") else charger.status),
                    total_connectors=charger_total_connectors,
                    available_connectors=charger_available_connectors,
                    connectors=connector_items,
                )
            )

        station_out.append(
            UserStationOut(
                station_id=station_id,
                station_name=station["station_name"],
                address=station["address"],
                longitude=station["longitude"],
                latitude=station["latitude"],
                station_description=station["station_description"],
                phone_number=station["phone_number"],
                has_wifi=station["has_wifi"],
                has_parking=station["has_parking"],
                has_food=station["has_food"],
                has_coffee=station["has_coffee"],
                has_bedroom=station["has_bedroom"],
                has_restroom=station["has_restroom"],
                station_images=station["station_images"] or [],
                total_chargers=total_chargers,
                available_chargers=available_chargers,
                total_connectors=total_connectors,
                available_connectors=available_connectors,
                average_rating=aggregate_map.get(station_id, (0.0, 0))[0],
                review_count=aggregate_map.get(station_id, (0.0, 0))[1],
                my_rating=my_rating_map.get(station_id),
                distance_km=(
                    round(float(station["distance_meters"]) / 1000, 2)
                    if "distance_meters" in station and station["distance_meters"] is not None
                    else None
                ),
                charger_types=sorted(charger_types),
                chargers=chargers_out,
                created_at=station["created_at"],
            )
        )

    return station_out


async def update_user_profile(
    current_user: User,
    payload: UserProfileUpdate,
    db: AsyncSession,
) -> User:
    update_data = payload.model_dump(exclude_unset=True)

    if not update_data:
        return current_user

    next_email = update_data.get("email")
    if next_email and next_email != current_user.email:
        result = await db.execute(
            select(User).where(User.email == next_email, User.user_id != current_user.user_id)
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

    for field in ["user_name", "email", "phone_number", "vehicle"]:
        if field in update_data:
            setattr(current_user, field, update_data[field])

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user