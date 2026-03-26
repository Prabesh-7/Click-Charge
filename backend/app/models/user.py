from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base, engine
from sqlalchemy import Enum
import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    STAFF = "STAFF"





class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    role = Column(
    Enum(UserRole, name="user_roles"),
    nullable=False,
    default=UserRole.USER
        
        
    )
    phone_number = Column(String(20))
    vehicle = Column(String(100))
    station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("User Tables created!")