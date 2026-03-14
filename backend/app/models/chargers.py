from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.database import Base, engine
import enum


class ChargerStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_CHARGING = "IN_CHARGING"
    RESERVED = "RESERVED"


class ChargerType(str, enum.Enum):
    CCS2 = "CCS2"
    GBT = "GBT"
    TYPE2 = "TYPE2"
    CHADEMO = "CHAdeMO"


class Charger(Base):
    __tablename__ = "chargers"

    charger_id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=False)
    name = Column(String(150), nullable=False)

    status = Column(
        Enum(ChargerStatus, name="charger_status"),
        nullable=False,
        default=ChargerStatus.AVAILABLE
    )

    type = Column(
        Enum(ChargerType, name="charger_type"),
        nullable=False
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Charger Tables created!")

