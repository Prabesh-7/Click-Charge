from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user_station import UserStationOut
from app.services.user_service import get_available_stations_for_user
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
