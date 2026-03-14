from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.user import User, UserRole
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

