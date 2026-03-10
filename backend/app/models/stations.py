from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base,engine


class Station(Base):
    __tablename__ = "stations"

    station_id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String(150), nullable=False)

    address = Column(String(255), nullable=False)

    longitude = Column(Float, nullable=False)
    latitude = Column(Float, nullable=False)

    total_charger = Column(Integer, nullable=False)

    manager_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    manager = relationship("User")
    
    
async def create_tables():
    async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    print(" station Tables created!")