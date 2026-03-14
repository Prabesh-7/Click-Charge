# # app/routes/manager_routes.py
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.database import get_db
# from app.schemas.charger import ChargerCreate
# from app.services.charger_service import add_charger_by_manager

# router = APIRouter(prefix="/manager", tags=["Chargers"])


# @router.post("/add-charger")
# async def add_charger(
#     data: ChargerCreate,
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Manager adds a new charger to their station.
#     """
#     # Optional: check manager owns this station
#     # You can add JWT dependency here to get current_user and verify ownership

#     return await add_charger_by_manager(data, db)

# app/routes/manager_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.charger import ChargerCreate, ChargerOut
from app.schemas.userValidation import UserCreate, UserOut
from app.services.charger_service import add_charger_by_manager
from app.services.manager_service import create_staff_for_manager
from app.utils.dependencies import require_manager

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.post("/add-charger", response_model=ChargerOut)
async def add_charger(
    data: ChargerCreate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    return await add_charger_by_manager(data, current_manager, db)


@router.post("/create-staff", response_model=UserOut)
async def create_staff(
    data: UserCreate,
    current_manager: User = Depends(require_manager),
    db: AsyncSession = Depends(get_db),
):
    # current_manager is enforced as MANAGER; we don't need it further yet,
    # but it is available if later you want to associate staff with manager/station.
    return await create_staff_for_manager(data, db)