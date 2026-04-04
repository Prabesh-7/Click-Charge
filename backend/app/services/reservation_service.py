from datetime import datetime

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chargers import Charger, Connector, ConnectorSlot
from app.models.reservation import Reservation, ReservationStatus, ReservationType
from app.models.user import User


async def create_slot_reservation_record(
    db: AsyncSession,
    slot: ConnectorSlot,
    reserved_by_user: User,
    reserved_at: datetime,
) -> None:
    charger_meta_result = await db.execute(
        select(Charger.charger_id, Charger.station_id)
        .join(Connector, Connector.charger_id == Charger.charger_id)
        .where(Connector.connector_id == slot.connector_id)
    )
    charger_meta = charger_meta_result.first()

    reservation = Reservation(
        reservation_type=ReservationType.SLOT,
        slot_id=slot.slot_id,
        connector_id=slot.connector_id,
        charger_id=charger_meta.charger_id if charger_meta else None,
        station_id=charger_meta.station_id if charger_meta else None,
        reserved_by_user_id=reserved_by_user.user_id,
        reserved_by_user_name=reserved_by_user.user_name,
        reserved_by_email=reserved_by_user.email,
        reserved_by_phone_number=reserved_by_user.phone_number,
        status=ReservationStatus.ACTIVE,
        start_time=slot.start_time,
        end_time=slot.end_time,
        reserved_at=reserved_at,
    )
    db.add(reservation)


async def create_connector_reservation_record(
    db: AsyncSession,
    charger: Charger,
    connector: Connector,
    reserved_by_user: User,
    reserved_at: datetime,
) -> None:
    reservation = Reservation(
        reservation_type=ReservationType.CONNECTOR,
        slot_id=None,
        connector_id=connector.connector_id,
        charger_id=charger.charger_id,
        station_id=charger.station_id,
        reserved_by_user_id=reserved_by_user.user_id,
        reserved_by_user_name=reserved_by_user.user_name,
        reserved_by_email=reserved_by_user.email,
        reserved_by_phone_number=reserved_by_user.phone_number,
        status=ReservationStatus.ACTIVE,
        start_time=None,
        end_time=None,
        reserved_at=reserved_at,
    )
    db.add(reservation)


async def close_active_slot_reservations(
    db: AsyncSession,
    slot_id: int,
    status: ReservationStatus,
) -> None:
    await db.execute(
        update(Reservation)
        .where(
            Reservation.reservation_type == ReservationType.SLOT,
            Reservation.slot_id == slot_id,
            Reservation.status == ReservationStatus.ACTIVE,
        )
        .values(
            status=status,
            updated_at=func.now(),
        )
    )


async def close_active_connector_reservations(
    db: AsyncSession,
    connector_id: int,
    status: ReservationStatus,
) -> None:
    await db.execute(
        update(Reservation)
        .where(
            Reservation.reservation_type == ReservationType.CONNECTOR,
            Reservation.connector_id == connector_id,
            Reservation.status == ReservationStatus.ACTIVE,
        )
        .values(
            status=status,
            updated_at=func.now(),
        )
    )
