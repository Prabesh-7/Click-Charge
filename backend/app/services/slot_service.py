from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.stations import Station
from app.models.chargers import Charger, Connector, ConnectorSlot, SlotStatus
from app.schemas.slot import SlotCreate, SlotUpdate


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _validate_slot_time_window(start_time: datetime, end_time: datetime) -> tuple[datetime, datetime]:
    start_dt = _normalize_datetime(start_time)
    end_dt = _normalize_datetime(end_time)

    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="end_time must be greater than start_time")

    return start_dt, end_dt


async def _validate_connector_belongs_to_manager_station(
    connector_id: int,
    current_manager: User,
    db: AsyncSession,
) -> Connector:
    result = await db.execute(
        select(Connector)
        .join(Charger, Charger.charger_id == Connector.charger_id)
        .join(Station, Station.station_id == Charger.station_id)
        .where(
            Connector.connector_id == connector_id,
            Station.manager_id == current_manager.user_id,
        )
    )
    connector = result.scalar_one_or_none()

    if not connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    return connector


async def _validate_slot_overlap(
    connector_id: int,
    start_time: datetime,
    end_time: datetime,
    db: AsyncSession,
    exclude_slot_id: int | None = None,
) -> None:
    query = (
        select(ConnectorSlot)
        .where(
            ConnectorSlot.connector_id == connector_id,
            ConnectorSlot.status.in_([SlotStatus.OPEN, SlotStatus.RESERVED]),
            ConnectorSlot.start_time < end_time,
            ConnectorSlot.end_time > start_time,
        )
    )

    if exclude_slot_id is not None:
        query = query.where(ConnectorSlot.slot_id != exclude_slot_id)

    result = await db.execute(query)
    overlap_slot = result.scalar_one_or_none()
    if overlap_slot:
        raise HTTPException(status_code=400, detail="Overlapping slot already exists for this connector")


async def create_slot_by_manager(
    data: SlotCreate,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    connector = await _validate_connector_belongs_to_manager_station(data.connector_id, current_manager, db)
    start_dt, end_dt = _validate_slot_time_window(data.start_time, data.end_time)

    await _validate_slot_overlap(connector.connector_id, start_dt, end_dt, db)

    slot = ConnectorSlot(
        connector_id=connector.connector_id,
        start_time=start_dt,
        end_time=end_dt,
        status=SlotStatus.OPEN,
        created_by_manager_id=current_manager.user_id,
    )

    db.add(slot)
    await db.commit()

    return {"message": "Slot created successfully"}


async def _get_station_slots(station_id: int, db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(
            ConnectorSlot.slot_id,
            ConnectorSlot.connector_id,
            Connector.connector_number,
            Charger.charger_id,
            Charger.name.label("charger_name"),
            Charger.type.label("charger_type"),
            ConnectorSlot.start_time,
            ConnectorSlot.end_time,
            ConnectorSlot.status,
            ConnectorSlot.reserved_by_user_id,
            User.user_name.label("reserved_by_user_name"),
            User.email.label("reserved_by_email"),
            ConnectorSlot.reserved_at,
            ConnectorSlot.created_by_manager_id,
            ConnectorSlot.created_at,
            ConnectorSlot.updated_at,
        )
        .join(Connector, Connector.connector_id == ConnectorSlot.connector_id)
        .join(Charger, Charger.charger_id == Connector.charger_id)
        .outerjoin(User, User.user_id == ConnectorSlot.reserved_by_user_id)
        .where(Charger.station_id == station_id)
        .order_by(ConnectorSlot.start_time.asc())
    )

    rows = result.mappings().all()
    normalized_rows: list[dict] = []

    for row in rows:
        item = dict(row)
        if hasattr(item.get("charger_type"), "value"):
            item["charger_type"] = item["charger_type"].value
        if hasattr(item.get("status"), "value"):
            item["status"] = item["status"].value
        normalized_rows.append(item)

    return normalized_rows


async def get_slots_by_manager(
    current_manager: User,
    db: AsyncSession,
) -> list[dict]:
    station_result = await db.execute(
        select(Station).where(Station.manager_id == current_manager.user_id)
    )
    station = station_result.scalar_one_or_none()

    if not station:
        return []

    return await _get_station_slots(station.station_id, db)


async def get_slots_by_staff(
    current_staff: User,
    db: AsyncSession,
) -> list[dict]:
    if not current_staff.station_id:
        return []

    return await _get_station_slots(current_staff.station_id, db)


async def get_slots_by_station(
    station_id: int,
    db: AsyncSession,
) -> list[dict]:
    return await _get_station_slots(station_id, db)


async def _get_manager_slot(
    slot_id: int,
    current_manager: User,
    db: AsyncSession,
) -> ConnectorSlot:
    result = await db.execute(
        select(ConnectorSlot)
        .join(Connector, Connector.connector_id == ConnectorSlot.connector_id)
        .join(Charger, Charger.charger_id == Connector.charger_id)
        .join(Station, Station.station_id == Charger.station_id)
        .where(
            ConnectorSlot.slot_id == slot_id,
            Station.manager_id == current_manager.user_id,
        )
    )
    slot = result.scalar_one_or_none()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    return slot


async def update_slot_by_manager(
    slot_id: int,
    data: SlotUpdate,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    slot = await _get_manager_slot(slot_id, current_manager, db)

    if slot.status == SlotStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Cannot update a reserved slot")

    start_dt, end_dt = _validate_slot_time_window(data.start_time, data.end_time)
    await _validate_slot_overlap(slot.connector_id, start_dt, end_dt, db, exclude_slot_id=slot.slot_id)

    slot.start_time = start_dt
    slot.end_time = end_dt

    await db.commit()
    return {"message": "Slot updated successfully"}


async def delete_slot_by_manager(
    slot_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    slot = await _get_manager_slot(slot_id, current_manager, db)

    if slot.status == SlotStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Cannot delete a reserved slot")

    await db.delete(slot)
    await db.commit()

    return {"message": "Slot deleted successfully"}


async def release_slot_reservation_by_manager(
    slot_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    slot = await _get_manager_slot(slot_id, current_manager, db)

    if slot.status != SlotStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Slot is not reserved")

    slot.status = SlotStatus.OPEN
    slot.reserved_by_user_id = None
    slot.reserved_at = None

    await db.commit()

    return {"message": "Slot reservation released successfully"}


async def _get_staff_slot(
    slot_id: int,
    current_staff: User,
    db: AsyncSession,
) -> ConnectorSlot:
    if not current_staff.station_id:
        raise HTTPException(status_code=404, detail="Staff is not assigned to any station")

    result = await db.execute(
        select(ConnectorSlot)
        .join(Connector, Connector.connector_id == ConnectorSlot.connector_id)
        .join(Charger, Charger.charger_id == Connector.charger_id)
        .where(
            ConnectorSlot.slot_id == slot_id,
            Charger.station_id == current_staff.station_id,
        )
    )
    slot = result.scalar_one_or_none()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    return slot


async def release_slot_reservation_by_staff(
    slot_id: int,
    current_staff: User,
    db: AsyncSession,
) -> dict:
    slot = await _get_staff_slot(slot_id, current_staff, db)

    if slot.status != SlotStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Slot is not reserved")

    slot.status = SlotStatus.OPEN
    slot.reserved_by_user_id = None
    slot.reserved_at = None

    await db.commit()

    return {"message": "Slot reservation released successfully"}


async def reserve_slot_by_user(
    slot_id: int,
    current_user: User,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(ConnectorSlot).where(ConnectorSlot.slot_id == slot_id)
    )
    slot = result.scalar_one_or_none()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != SlotStatus.OPEN:
        raise HTTPException(status_code=400, detail="Slot is not available")

    now = datetime.now(tz=timezone.utc)
    if slot.end_time <= now:
        raise HTTPException(status_code=400, detail="Cannot reserve a past slot")

    slot.status = SlotStatus.RESERVED
    slot.reserved_by_user_id = current_user.user_id
    slot.reserved_at = now

    await db.commit()

    return {"message": "Slot reserved successfully"}


async def cancel_slot_reservation_by_user(
    slot_id: int,
    current_user: User,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(ConnectorSlot).where(ConnectorSlot.slot_id == slot_id)
    )
    slot = result.scalar_one_or_none()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != SlotStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Slot is not reserved")

    if slot.reserved_by_user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You can only cancel your own reservation")

    slot.status = SlotStatus.OPEN
    slot.reserved_by_user_id = None
    slot.reserved_at = None

    await db.commit()

    return {"message": "Slot reservation cancelled successfully"}
