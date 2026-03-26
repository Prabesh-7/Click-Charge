from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
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

    manager_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to the manager user account for this station.
    manager = relationship("User", foreign_keys=[manager_id])
    
    
async def create_tables():
    async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            await conn.run_sync(Base.metadata.create_all)
    print(" station Tables created!")
