from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String
from fastapi import HTTPException

from app.models.user import User, UserRole
from app.models.stations import Station
from app.models.chargers import Charger
from app.schemas.manager_station import StationOut
from app.schemas.userValidation import UserCreate, UserOut
from typing import List


async def create_staff_for_manager(
    data: UserCreate,
    current_manager: User,
    db: AsyncSession,
):
  # check if email already exists
  result = await db.execute(
      select(User).where(User.email == data.email)
  )
  existing_user = result.scalar_one_or_none()

  if existing_user:
      raise HTTPException(status_code=400, detail="Email already registered")

  station_result = await db.execute(
      select(Station).where(Station.manager_id == current_manager.user_id)
  )
  station = station_result.scalar_one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  staff = User(
      user_name=data.user_name,
      email=data.email,
      password=data.password,
      phone_number=data.phone_number,
      vehicle=data.vehicle,
      role=UserRole.STAFF,
      station_id=station.station_id,
  )

  db.add(staff)
  await db.commit()
  await db.refresh(staff)

  return UserOut.model_validate(staff)


async def get_staff_by_manager_station(
    current_manager: User,
    db: AsyncSession,
) -> List[UserOut]:
  station_result = await db.execute(
      select(Station).where(Station.manager_id == current_manager.user_id)
  )
  station = station_result.scalar_one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  staff_result = await db.execute(
      select(User)
      .where(cast(User.role, String) == UserRole.STAFF.value)
      .where(User.station_id == station.station_id)
      .order_by(User.created_at.desc())
  )
  staff_members = staff_result.scalars().all()

  return [UserOut.model_validate(staff) for staff in staff_members]


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


async def _get_manager_staff(
    user_id: int,
    current_manager: User,
    db: AsyncSession,
) -> User:
  # Ensure manager can only manage staff from their own station
  station_result = await db.execute(
      select(Station).where(Station.manager_id == current_manager.user_id)
  )
  station = station_result.scalar_one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  staff_result = await db.execute(
      select(User).where(
          User.user_id == user_id,
          User.station_id == station.station_id,
          cast(User.role, String) == UserRole.STAFF.value,
      )
  )
  staff = staff_result.scalar_one_or_none()

  if not staff:
      raise HTTPException(status_code=404, detail="Staff member not found")

  return staff


async def edit_staff_for_manager(
    user_id: int,
    data: UserCreate,
    current_manager: User,
    db: AsyncSession,
):
  staff = await _get_manager_staff(user_id, current_manager, db)

  # Update only provided fields
  if data.user_name:
      staff.user_name = data.user_name
  if data.email:
      staff.email = data.email
  if data.password:
      staff.password = data.password
  if data.phone_number:
      staff.phone_number = data.phone_number
  if data.vehicle:
      staff.vehicle = data.vehicle

  await db.commit()
  await db.refresh(staff)

  return UserOut.model_validate(staff)


async def delete_staff_for_manager(
    user_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
  staff = await _get_manager_staff(user_id, current_manager, db)

  await db.delete(staff)
  await db.commit()

  return {"message": "Staff member deleted successfully"}