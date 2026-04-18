from datetime import datetime

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.stations import Station
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


async def get_reservations_by_user(
    current_user: User,
    db: AsyncSession,
) -> list[dict]:
    result = await db.execute(
        select(
            Reservation.reservation_id,
            Reservation.reservation_type,
            Reservation.status,
            Reservation.station_id,
            Station.station_name,
            Reservation.charger_id,
            Charger.name.label("charger_name"),
            Charger.type.label("charger_type"),
            Reservation.connector_id,
            Connector.connector_number,
            Connector.charge_point_id,
            Reservation.slot_id,
            Reservation.start_time,
            Reservation.end_time,
            Reservation.reserved_at,
            Reservation.reserved_by_user_id,
            Reservation.reserved_by_user_name,
            Reservation.reserved_by_email,
            Reservation.reserved_by_phone_number,
        )
        .join(Charger, Charger.charger_id == Reservation.charger_id)
        .join(Connector, Connector.connector_id == Reservation.connector_id)
        .join(Station, Station.station_id == Reservation.station_id)
        .where(Reservation.reserved_by_user_id == current_user.user_id)
        .order_by(Reservation.reserved_at.desc(), Reservation.reservation_id.desc())
    )

    rows = result.mappings().all()
    normalized_rows: list[dict] = []

    for row in rows:
        item = dict(row)
        if hasattr(item.get("reservation_type"), "value"):
            item["reservation_type"] = item["reservation_type"].value
        if hasattr(item.get("status"), "value"):
            item["status"] = item["status"].value
        if hasattr(item.get("charger_type"), "value"):
            item["charger_type"] = item["charger_type"].value
        normalized_rows.append(item)

    return normalized_rows
