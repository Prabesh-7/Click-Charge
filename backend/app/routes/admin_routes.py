from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.manager_station import ManagerWithStationCreate, StationOut
from app.services.admin_service import create_manager_with_station, get_all_stations
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/create-manager-station")
async def create_manager_station(
    data: ManagerWithStationCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_manager_with_station(data, db)


@router.get("/stations", response_model=List[StationOut])
async def get_stations(
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all stations in the system. Only accessible by admins.
    """
    return await get_all_stations(db)