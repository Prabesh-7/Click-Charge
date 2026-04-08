from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String
from fastapi import HTTPException
from fastapi import UploadFile
import os
import uuid

from app.models.user import User, UserRole
from app.models.stations import Station
from app.models.chargers import Charger
from app.models.station_review import StationReview
from app.schemas.manager_station import StationOut, ManagerStationUpdate
from app.schemas.station_review import ManagerStationReviewOut, StationReviewSummaryOut
from app.schemas.userValidation import UserCreate, UserOut
from typing import List


ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
          Station.station_description,
          Station.phone_number,
          Station.has_wifi,
          Station.has_parking,
          Station.has_food,
          Station.has_coffee,
          Station.has_bedroom,
          Station.has_restroom,
          Station.station_images,
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
          Station.station_description,
          Station.phone_number,
          Station.has_wifi,
          Station.has_parking,
          Station.has_food,
          Station.has_coffee,
          Station.has_bedroom,
          Station.has_restroom,
          Station.station_images,
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


async def update_manager_station_details(
    data: ManagerStationUpdate,
    current_manager: User,
    db: AsyncSession,
) -> StationOut:
  station_result = await db.execute(
      select(Station).where(Station.manager_id == current_manager.user_id)
  )
  station = station_result.scalar_one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  if data.station_description is not None:
      station.station_description = data.station_description
  if data.phone_number is not None:
      station.phone_number = data.phone_number
  if data.has_wifi is not None:
      station.has_wifi = data.has_wifi
  if data.has_parking is not None:
      station.has_parking = data.has_parking
  if data.has_food is not None:
      station.has_food = data.has_food
  if data.has_coffee is not None:
      station.has_coffee = data.has_coffee
  if data.has_bedroom is not None:
      station.has_bedroom = data.has_bedroom
  if data.has_restroom is not None:
      station.has_restroom = data.has_restroom
  if data.station_images is not None:
      station.station_images = data.station_images

  await db.commit()

  return await get_manager_station_details(current_manager, db)


async def upload_station_image_for_manager(
    file: UploadFile,
    current_manager: User,
    db: AsyncSession,
    base_url: str,
) -> dict:
  station_result = await db.execute(
      select(Station).where(Station.manager_id == current_manager.user_id)
  )
  station = station_result.scalar_one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  if not file.content_type or not file.content_type.startswith("image/"):
      raise HTTPException(status_code=400, detail="Only image files allowed")

  if "." not in file.filename:
      raise HTTPException(status_code=400, detail="Invalid image format")

  file_ext = file.filename.split(".")[-1].lower()
  if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
      raise HTTPException(status_code=400, detail="Invalid image format")

  filename = f"{uuid.uuid4()}.{file_ext}"
  file_path = os.path.join(UPLOAD_DIR, filename)

  with open(file_path, "wb") as saved_file:
      content = await file.read()
      saved_file.write(content)

  image_url = f"{base_url}uploads/{filename}"

  existing_images = station.station_images or []
  station.station_images = [*existing_images, image_url]

  await db.commit()

  return {"image_url": image_url}


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


async def get_station_reviews_for_manager(
    current_manager: User,
    db: AsyncSession,
) -> list[ManagerStationReviewOut]:
  station_result = await db.execute(
      select(Station).where(Station.manager_id == current_manager.user_id)
  )
  station = station_result.scalar_one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  reviews_result = await db.execute(
      select(StationReview, User.user_name, User.email)
      .join(User, User.user_id == StationReview.user_id)
      .where(StationReview.station_id == station.station_id)
      .order_by(StationReview.updated_at.desc())
  )

  return [
      ManagerStationReviewOut(
          review_id=review.review_id,
          station_id=review.station_id,
          user_id=review.user_id,
          user_name=user_name,
          user_email=user_email,
          rating=review.rating,
          review_text=review.review_text,
          created_at=review.created_at,
          updated_at=review.updated_at,
      )
      for review, user_name, user_email in reviews_result.all()
  ]


async def get_station_review_summary_for_manager(
    current_manager: User,
    db: AsyncSession,
) -> StationReviewSummaryOut:
  station_result = await db.execute(
      select(Station).where(Station.manager_id == current_manager.user_id)
  )
  station = station_result.scalar_one_or_none()

  if not station:
      raise HTTPException(
          status_code=404,
          detail="No station assigned to this manager.",
      )

  aggregate_result = await db.execute(
      select(
          func.coalesce(func.avg(StationReview.rating), 0).label("average_rating"),
          func.count(StationReview.review_id).label("review_count"),
      ).where(StationReview.station_id == station.station_id)
  )
  aggregate = aggregate_result.one()

  return StationReviewSummaryOut(
      station_id=station.station_id,
      average_rating=round(float(aggregate.average_rating or 0), 2),
      review_count=int(aggregate.review_count or 0),
      my_rating=None,
      my_review_text=None,
  )