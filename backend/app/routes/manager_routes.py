from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.charger import ChargerCreate, ChargerOut, ChargerControlResponse, ChargerMeterValues
from app.schemas.manager_station import StationOut
from app.schemas.userValidation import UserCreate, UserOut
from app.services.charger_service import (
    add_charger_by_manager,
    get_chargers_by_manager,
    start_charging_by_manager,
    stop_charging_by_manager,
    get_meter_values_by_manager,
)
from app.services.manager_service import (
    create_staff_for_manager,
    get_manager_station_details,
    get_staff_by_manager_station,
)
from app.utils.dependencies import require_manager
from typing import List

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.post("/add-charger", response_model=ChargerOut)

async def add_charger(
    data: ChargerCreate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await add_charger_by_manager(data, current_manager, db)


@router.get("/my-chargers", response_model=List[ChargerOut])
async def get_my_chargers(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all chargers for the manager's station.
    """
    return await get_chargers_by_manager(current_manager, db)


@router.get("/my-station", response_model=StationOut)
async def get_my_station(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Get station details for the current manager.
    """
    return await get_manager_station_details(current_manager, db)


@router.post("/chargers/{charger_id}/start", response_model=ChargerControlResponse)
async def start_charging(
    charger_id: int,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await start_charging_by_manager(charger_id, current_manager, db)


@router.post("/chargers/{charger_id}/stop", response_model=ChargerControlResponse)
async def stop_charging(
    charger_id: int,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await stop_charging_by_manager(charger_id, current_manager, db)


@router.get("/chargers/{charger_id}/meter-values", response_model=ChargerMeterValues)
async def get_meter_values(
    charger_id: int,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await get_meter_values_by_manager(charger_id, current_manager, db)


@router.post("/create-staff", response_model=UserOut)
async def create_staff(
    data: UserCreate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await create_staff_for_manager(data, current_manager, db)


@router.get("/my-staff", response_model=List[UserOut])
async def get_my_staff(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all staff assigned to the manager's station.
    """
    return await get_staff_by_manager_station(current_manager, db)