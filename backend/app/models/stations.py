from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import ARRAY
from app.database import Base,engine


class Station(Base):
    __tablename__ = "stations"

    station_id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String(150), nullable=False)

    address = Column(String(255), nullable=False)

    location = Column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False
    )

    total_charger = Column(Integer, nullable=False)
    station_description = Column(String(500), nullable=True)

    phone_number = Column(String(20), nullable=True)
    has_wifi = Column(Boolean, nullable=False, default=False)
    has_parking = Column(Boolean, nullable=False, default=False)
    has_food = Column(Boolean, nullable=False, default=False)
    has_coffee = Column(Boolean, nullable=False, default=False)
    has_bedroom = Column(Boolean, nullable=False, default=False)
    has_restroom = Column(Boolean, nullable=False, default=False)
    station_images = Column(ARRAY(String), nullable=False, default=list)

    manager_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


    manager = relationship("User", foreign_keys=[manager_id])
    
    
async def create_tables():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        await conn.run_sync(Base.metadata.create_all)

       

    print(" station Tables created!")
