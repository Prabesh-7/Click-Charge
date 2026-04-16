from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy import text
from app.database import Base, engine
import enum


class ReservationStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
    RELEASED = "RELEASED"
    EXPIRED = "EXPIRED"
    COMPLETED = "COMPLETED"

class ReservationType(str, enum.Enum):
    SLOT = "SLOT"
    CONNECTOR = "CONNECTOR"


class Reservation(Base):
    __tablename__ = "reservations"

    reservation_id = Column(Integer, primary_key=True, index=True)

    # A reservation can be for a slot, a direct connector reservation, or both.
    reservation_type = Column(
        Enum(ReservationType, name="reservation_type"),
        nullable=False,
        default=ReservationType.SLOT,
    )
    slot_id = Column(Integer, ForeignKey("connector_slots.slot_id"), nullable=True)
    connector_id = Column(Integer, ForeignKey("connectors.connector_id"), nullable=True)
    charger_id = Column(Integer, ForeignKey("chargers.charger_id"), nullable=True)
    station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=True)

    reserved_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    reserved_by_user_name = Column(String(100), nullable=True)
    reserved_by_email = Column(String(150), nullable=True)
    reserved_by_phone_number = Column(String(20), nullable=True)

    status = Column(
        Enum(ReservationStatus, name="reservation_status"),
        nullable=False,
        default=ReservationStatus.ACTIVE,
    )

    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    reserved_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: Reservation.__table__.create(sync_conn, checkfirst=True))

        # Keep schema in sync for existing databases without full migrations.
        await conn.execute(text("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reserved_by_user_name VARCHAR(100)"))
        await conn.execute(text("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reserved_by_email VARCHAR(150)"))
        await conn.execute(text("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reserved_by_phone_number VARCHAR(20)"))

        # Remove legacy columns from the earlier draft model so inserts stay clean.
        await conn.execute(text("ALTER TABLE reservations DROP COLUMN IF EXISTS source"))
        await conn.execute(text("ALTER TABLE reservations DROP COLUMN IF EXISTS closed_at"))
        await conn.execute(text("ALTER TABLE reservations DROP COLUMN IF EXISTS closed_by_user_id"))
        await conn.execute(text("ALTER TABLE reservations DROP COLUMN IF EXISTS close_reason"))

    print("Reservation Tables created!")
