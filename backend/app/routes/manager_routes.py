from datetime import date
from fastapi import APIRouter, Depends, Query, File, UploadFile, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.charger import ChargerCreate, ChargerOut, ChargerControlResponse, ChargerMeterValues, ChargerPricingUpdate
from app.schemas.charging_session import ChargingSessionOut
from app.schemas.reservation import ReservationOut
from app.schemas.slot import SlotCreate, SlotOut, SlotUpdate
from app.schemas.manager_station import StationOut, ManagerStationUpdate
from app.schemas.station_review import ManagerStationReviewOut, StationReviewSummaryOut
from app.schemas.wallet import WalletOut
from app.schemas.userValidation import UserCreate, UserOut
from app.services.charger_service import (
    add_charger_by_manager,
    get_chargers_by_manager,
    start_charging_by_manager,
    stop_charging_by_manager,
    reserve_connector_by_manager,
    release_reserved_connector_by_manager,
    get_reservations_by_manager,
    get_meter_values_by_manager,
    edit_charger_by_manager,
    delete_charger_by_manager,
    update_charger_pricing_by_manager,
    get_charging_sessions_by_manager,
)
from app.services.manager_service import (
    create_staff_for_manager,
    get_manager_station_details,
    get_staff_by_manager_station,
    edit_staff_for_manager,
    delete_staff_for_manager,
    update_manager_station_details,
    upload_station_image_for_manager,
    get_station_reviews_for_manager,
    get_station_review_summary_for_manager,
)
from app.services.slot_service import (
    create_slot_by_manager,
    get_slots_by_manager,
    update_slot_by_manager,
    delete_slot_by_manager,
    release_slot_reservation_by_manager,
)
from app.services.wallet_service import get_wallet_by_user
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


@router.get("/station-reviews", response_model=List[ManagerStationReviewOut])
async def get_my_station_reviews(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await get_station_reviews_for_manager(current_manager, db)


@router.get("/station-reviews/summary", response_model=StationReviewSummaryOut)
async def get_my_station_review_summary(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await get_station_review_summary_for_manager(current_manager, db)


@router.get("/wallet", response_model=WalletOut)
async def get_manager_wallet(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    wallet = await get_wallet_by_user(current_manager, db)
    return {
        "wallet_id": wallet.wallet_id,
        "user_id": wallet.user_id,
        "balance": float(wallet.balance),
        "updated_at": wallet.updated_at,
    }


@router.put("/my-station", response_model=StationOut)
async def update_my_station(
    data: ManagerStationUpdate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Update station details for the current manager.
    """
    return await update_manager_station_details(data, current_manager, db)


@router.post("/upload-image")
async def upload_station_image(
    request: Request,
    file: UploadFile = File(...),
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    base_url = str(request.base_url)
    return await upload_station_image_for_manager(file, current_manager, db, base_url)


@router.post("/chargers/{charger_id}/start", response_model=ChargerControlResponse)
async def start_charging(
    charger_id: int,
    connector_id: int | None = Query(default=None),
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await start_charging_by_manager(charger_id, connector_id, current_manager, db)


@router.post("/chargers/{charger_id}/stop", response_model=ChargerControlResponse)
async def stop_charging(
    charger_id: int,
    connector_id: int | None = Query(default=None),
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await stop_charging_by_manager(charger_id, connector_id, current_manager, db)


@router.post("/chargers/{charger_id}/reserve", response_model=ChargerControlResponse)
async def reserve_connector(
    charger_id: int,
    connector_id: int | None = Query(default=None),
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await reserve_connector_by_manager(charger_id, connector_id, current_manager, db)


@router.post("/chargers/{charger_id}/release", response_model=ChargerControlResponse)
async def release_reserved_connector(
    charger_id: int,
    connector_id: int | None = Query(default=None),
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await release_reserved_connector_by_manager(charger_id, connector_id, current_manager, db)


@router.get("/chargers/{charger_id}/meter-values", response_model=ChargerMeterValues)
async def get_meter_values(
    charger_id: int,
    connector_id: int | None = Query(default=None),
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await get_meter_values_by_manager(charger_id, connector_id, current_manager, db)


@router.get("/reservations", response_model=List[ReservationOut])
async def get_my_reservations(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await get_reservations_by_manager(current_manager, db)


@router.get("/charging-sessions", response_model=List[ChargingSessionOut])
async def get_my_charging_sessions(
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await get_charging_sessions_by_manager(current_manager, db)


@router.get("/slots", response_model=List[SlotOut])
async def get_manageable_slots(
    slot_date: date | None = Query(default=None),
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await get_slots_by_manager(current_manager, db, slot_date)


@router.post("/slots")
async def create_slot(
    data: SlotCreate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await create_slot_by_manager(data, current_manager, db)


@router.put("/slots/{slot_id}")
async def update_slot(
    slot_id: int,
    data: SlotUpdate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await update_slot_by_manager(slot_id, data, current_manager, db)


@router.delete("/slots/{slot_id}")
async def delete_slot(
    slot_id: int,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await delete_slot_by_manager(slot_id, current_manager, db)


@router.post("/slots/{slot_id}/release")
async def release_slot_reservation(
    slot_id: int,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await release_slot_reservation_by_manager(slot_id, current_manager, db)


@router.put("/chargers/{charger_id}", response_model=ChargerOut)
async def edit_charger(
    charger_id: int,
    data: ChargerCreate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Edit charger details for the manager's station.
    """
    return await edit_charger_by_manager(charger_id, data, current_manager, db)


@router.put("/chargers/{charger_id}/pricing", response_model=ChargerOut)
async def update_charger_pricing(
    charger_id: int,
    data: ChargerPricingUpdate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await update_charger_pricing_by_manager(charger_id, data, current_manager, db)


@router.delete("/chargers/{charger_id}")
async def delete_charger(
    charger_id: int,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a charger from the manager's station.
    """
    return await delete_charger_by_manager(charger_id, current_manager, db)


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


@router.put("/staff/{user_id}", response_model=UserOut)
async def edit_staff(
    user_id: int,
    data: UserCreate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Edit staff member details in the manager's station.
    """
    return await edit_staff_for_manager(user_id, data, current_manager, db)


@router.delete("/staff/{user_id}")
async def delete_staff(
    user_id: int,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a staff member from the manager's station.
    """
    return await delete_staff_for_manager(user_id, current_manager, db)