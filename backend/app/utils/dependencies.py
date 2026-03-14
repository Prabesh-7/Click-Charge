from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.schemas.userValidation import TokenData
from app.models.user import User, UserRole
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.utils import jwt as jwt_utils


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            jwt_utils.SECRET_KEY,
            algorithms=[jwt_utils.ALGORITHM],
        )
        user_id: int | None = payload.get("user_id")
        email: str | None = payload.get("email")
        role: str | None = payload.get("role")

        if user_id is None or email is None or role is None:
            raise credentials_exception

        token_data = TokenData(user_id=user_id, email=email, role=role)
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.user_id == token_data.user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def require_manager(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can perform this action",
        )
    return current_user

