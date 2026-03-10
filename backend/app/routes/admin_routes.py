from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.manager_station import ManagerWithStationCreate
from app.services.admin_service import create_manager_with_station

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/create-manager-station")
async def create_manager_station(
    data: ManagerWithStationCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_manager_with_station(data, db)