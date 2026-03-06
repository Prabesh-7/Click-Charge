from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.user import User
from app.schemas.userValidation import UserCreate
from app.utils.security import hash_password


async def register_user(user: UserCreate, db: AsyncSession):

    # check if email already exists
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        user_name=user.user_name,
        email=user.email,
        password=user.password,
        phone_number=user.phone_number,
        vehicle=user.vehicle
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user