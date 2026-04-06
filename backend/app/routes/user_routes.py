from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.charger import ChargerControlResponse
from app.schemas.slot import SlotOut
from app.schemas.user_station import UserStationOut
from app.services.user_service import get_available_stations_for_user
from app.services.charger_service import reserve_connector_by_user, cancel_user_reservation
from app.services.slot_service import get_slots_by_station, reserve_slot_by_user, cancel_slot_reservation_by_user
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/stations", response_model=list[UserStationOut])
async def get_available_stations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all available stations for authenticated users.
    """
    return await get_available_stations_for_user(db)


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
