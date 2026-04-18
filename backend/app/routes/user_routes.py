from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.charger import ChargerControlResponse
from app.schemas.reservation import ReservationOut
from app.schemas.station_review import StationReviewCreate, StationReviewOut, StationReviewSummaryOut
from app.schemas.slot import SlotOut
from app.schemas.user_station import UserStationOut
from app.schemas.userValidation import UserOut, UserProfileUpdate
from app.services.reservation_service import get_reservations_by_user
from app.services.user_service import get_available_stations_for_user, update_user_profile
from app.services.station_review_service import (
    upsert_station_review,
    get_station_reviews,
    get_station_review_summary,
)
from app.services.charger_service import reserve_connector_by_user, cancel_user_reservation
from app.services.slot_service import get_slots_by_station, reserve_slot_by_user, cancel_slot_reservation_by_user
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile", response_model=UserOut)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/profile", response_model=UserOut)
async def patch_user_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_user_profile(current_user, payload, db)


@router.get("/stations", response_model=list[UserStationOut])
async def get_available_stations(
    radius_km: str | None = Query(default=None),
    user_latitude: float | None = Query(default=None, ge=-90, le=90),
    user_longitude: float | None = Query(default=None, ge=-180, le=180),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all available stations for authenticated users.
    """
    parsed_radius_km: int | None = None
    if radius_km is not None:
        try:
            parsed_radius = float(radius_km)
        except (TypeError, ValueError):
            raise HTTPException(status_code=422, detail="radius_km must be 5 or 10")

        if parsed_radius not in (5.0, 10.0):
            raise HTTPException(status_code=422, detail="radius_km must be 5 or 10")

        parsed_radius_km = int(parsed_radius)

    return await get_available_stations_for_user(
        db,
        current_user.user_id,
        radius_km=parsed_radius_km,
        user_latitude=user_latitude,
        user_longitude=user_longitude,
    )


@router.post("/chargers/{charger_id}/reserve", response_model=ChargerControlResponse)
async def reserve_connector(
    charger_id: int,
    connector_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await reserve_connector_by_user(charger_id, connector_id, current_user, db)


@router.post("/chargers/{charger_id}/cancel-reservation", response_model=ChargerControlResponse)
async def cancel_reservation(
    charger_id: int,
    connector_id: int | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await cancel_user_reservation(charger_id, connector_id, current_user, db)


@router.get("/reservations", response_model=list[ReservationOut])
async def get_my_reservations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_reservations_by_user(current_user, db)


@router.get("/stations/{station_id}/slots", response_model=list[SlotOut])
async def get_station_slots(
    station_id: int,
    slot_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_slots_by_station(station_id, db, slot_date)


@router.post("/slots/{slot_id}/reserve")
async def reserve_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await reserve_slot_by_user(slot_id, current_user, db)


@router.post("/slots/{slot_id}/cancel")
async def cancel_slot_reservation(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await cancel_slot_reservation_by_user(slot_id, current_user, db)


@router.post("/stations/{station_id}/review", response_model=StationReviewOut)
async def create_or_update_station_review(
    station_id: int,
    data: StationReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await upsert_station_review(station_id, data, current_user, db)


@router.get("/stations/{station_id}/reviews", response_model=list[StationReviewOut])
async def list_station_reviews(
    station_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_station_reviews(station_id, db)


@router.get("/stations/{station_id}/reviews/summary", response_model=StationReviewSummaryOut)
async def get_reviews_summary(
    station_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_station_review_summary(station_id, current_user, db)
