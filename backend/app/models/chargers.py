from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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
    
    # OCPP simulator identifier for this charger
    charge_point_id = Column(String(50), nullable=False, unique=True)

    status = Column(
        Enum(ChargerStatus, name="charger_status"),
        nullable=False,
        default=ChargerStatus.AVAILABLE
    )

    type = Column(
        Enum(ChargerType, name="charger_type"),
        nullable=False
    )

    max_power_kw = Column(Integer, nullable=False, default=50)  # simulator power capacity
    current_transaction_id = Column(Integer, nullable=True)      # track simulated session
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_status_change = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    connectors = relationship("Connector", back_populates="charger", cascade="all, delete-orphan", lazy="selectin")


class Connector(Base):
    __tablename__ = "connectors"
    __table_args__ = (
        UniqueConstraint("charger_id", "connector_number", name="uq_connector_charger_number"),
    )

    connector_id = Column(Integer, primary_key=True, index=True)
    charger_id = Column(Integer, ForeignKey("chargers.charger_id"), nullable=False)
    connector_number = Column(Integer, nullable=False)
    charge_point_id = Column(String(50), nullable=False, unique=True)

    status = Column(
        Enum(ChargerStatus, name="connector_status"),
        nullable=False,
        default=ChargerStatus.AVAILABLE,
    )

    current_transaction_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_status_change = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    charger = relationship("Charger", back_populates="connectors")


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Charger Tables created!")