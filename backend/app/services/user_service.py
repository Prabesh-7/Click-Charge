# from sqlalchemy.ext.asyncio import AsyncSession
# from app.models.user import User
# from app.schemas.userValidation import UserCreate
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select
# from fastapi import HTTPException
# from app.schemas.userValidation import UserLogin, Token
# # from app.utils.security import verify_password
# from app.utils.jwt import create_access_token
# # from app.utils.security import hash_password




# from app.schemas.userValidation import UserLogin

# from app.utils.jwt import create_access_token
# from app.schemas.userValidation import TokenData


# async def login_user(user: UserLogin, db: AsyncSession):

#     result = await db.execute(
#         select(User).where(User.email == user.email)
#     )

#     db_user = result.scalar_one_or_none()

#     # if not db_user:
#     #     raise HTTPException(status_code=401, detail="Invalid email or password")

#     # if not verify_password(user.password, db_user.password):
#     #     raise HTTPException(status_code=401, detail="Invalid email or password")
    
#     if not db_user or db_user.password != user.password:
#         raise HTTPException(status_code=401, detail="Invalid email or password")

#     token_data = TokenData(
#         user_id=db_user.user_id,
#         email=db_user.email,
#         role=db_user.role
#     )

#     access_token = create_access_token(token_data)

#     return {
#     "access_token": access_token,
#     "token_type": "bearer",
#     "user": {
#         "user_id": db_user.user_id,
#         "email": db_user.email,
#         "role": db_user.role,
#         "user": UserOut.model_validate(db_user),
#         "created_at": db_user.created_at,      # ← add this
#         "phone_number": db_user.phone_number,  # ← add optional fields too
#         "vehicle": db_user.vehicle,
#     }
# }


# async def register_user(user: UserCreate, db: AsyncSession):

#     # check if email already exists
#     result = await db.execute(
#         select(User).where(User.email == user.email)
#         )
#     existing_user = result.scalar_one_or_none()

#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     new_user = User(
#         user_name=user.user_name,
#         email=user.email,
#         password=user.password,
#         phone_number=user.phone_number,
#         vehicle=user.vehicle
#     )

#     db.add(new_user)
#     await db.commit()
#     await db.refresh(new_user)

#     return new_user


from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.stations import Station
from app.models.chargers import Charger, ChargerStatus
from app.schemas.userValidation import UserCreate, UserOut
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.schemas.userValidation import UserLogin
from app.utils.jwt import create_access_token
from app.schemas.userValidation import TokenData
from app.schemas.user_station import UserStationOut, UserStationChargerOut, UserStationConnectorOut


async def login_user(user: UserLogin, db: AsyncSession):

    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    db_user = result.scalar_one_or_none()
    


    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

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
        password=user.password,
        phone_number=user.phone_number,
        vehicle=user.vehicle
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


async def get_available_stations_for_user(db: AsyncSession) -> list[UserStationOut]:
    station_result = await db.execute(
        select(
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
        )
        .order_by(Station.created_at.desc())
    )

    stations = station_result.mappings().all()
    if not stations:
        return []

    station_ids = [station["station_id"] for station in stations]

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
                charger_types=sorted(charger_types),
                chargers=chargers_out,
                created_at=station["created_at"],
            )
        )

    return station_out