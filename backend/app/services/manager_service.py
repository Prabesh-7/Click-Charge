from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException

from app.models.user import User, UserRole
from app.models.stations import Station
from app.models.chargers import Charger
from app.schemas.manager_station import StationOut
from app.schemas.userValidation import UserCreate, UserOut


async def create_staff_for_manager(
    data: UserCreate,
    db: AsyncSession,
):
  # check if email already exists
  result = await db.execute(
      select(User).where(User.email == data.email)
  )
  existing_user = result.scalar_one_or_none()

  if existing_user:
      raise HTTPException(status_code=400, detail="Email already registered")

  staff = User(
      user_name=data.user_name,
      email=data.email,
      password=data.password,
      phone_number=data.phone_number,
      vehicle=data.vehicle,
      role=UserRole.STAFF,
  )

  db.add(staff)
  await db.commit()
  await db.refresh(staff)

  return UserOut.model_validate(staff)


async def get_manager_station_details(
    current_manager: User,
    db: AsyncSession,
) -> StationOut:
  result = await db.execute(
      select(
          Station.station_id,
          Station.station_name,
          Station.address,
          func.ST_X(Station.location).label("longitude"),
          func.ST_Y(Station.location).label("latitude"),
          func.count(Charger.charger_id).label("total_charger"),
          Station.manager_id,
          Station.created_at,
      )
      .outerjoin(Charger, Charger.station_id == Station.station_id)
      .where(Station.manager_id == current_manager.user_id)
      .group_by(
          Station.station_id,
          Station.station_name,
          Station.address,
          Station.location,
          Station.manager_id,
          Station.created_at,
      )
  )
  station = result.mappings().one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  return StationOut.model_validate(station)

