from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.charger import ChargerOut, ChargerControlResponse, ChargerMeterValues
from app.services.charger_service import (
    get_chargers_by_staff,
    start_charging_by_staff,
    stop_charging_by_staff,
    get_meter_values_by_staff,
)
from app.utils.dependencies import require_staff

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.get("/my-chargers", response_model=List[ChargerOut])
async def get_my_chargers(
    current_staff: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all chargers for the current staff's assigned station.
    """
    return await get_chargers_by_staff(current_staff, db)


@router.post("/chargers/{charger_id}/start", response_model=ChargerControlResponse)
async def start_charging(
    charger_id: int,
    current_staff: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    return await start_charging_by_staff(charger_id, current_staff, db)


@router.post("/chargers/{charger_id}/stop", response_model=ChargerControlResponse)
async def stop_charging(
    charger_id: int,
    current_staff: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    return await stop_charging_by_staff(charger_id, current_staff, db)


@router.get("/chargers/{charger_id}/meter-values", response_model=ChargerMeterValues)
async def get_meter_values(
    charger_id: int,
    current_staff: User = Depends(require_staff),
    db: AsyncSession = Depends(get_db),
):
    return await get_meter_values_by_staff(charger_id, current_staff, db)
