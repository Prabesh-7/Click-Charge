from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.manager_station import ManagerWithStationCreate, StationOut, StationCreate
from app.services.admin_service import create_manager_with_station, get_all_stations, edit_station, delete_station
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


@router.put("/stations/{station_id}", response_model=StationOut)
async def edit_station_route(
    station_id: int,
    data: StationCreate,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Edit a station. Only accessible by admins.
    """
    return await edit_station(station_id, data, db)


@router.delete("/stations/{station_id}")
async def delete_station_route(
    station_id: int,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a station. Only accessible by admins.
    """
    return await delete_station(station_id, db)