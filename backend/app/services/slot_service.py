from datetime import date, datetime, time, timedelta, timezone
from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.stations import Station
from app.models.chargers import Charger, Connector, ConnectorSlot, SlotStatus
from app.models.reservation import ReservationStatus
from app.schemas.slot import SlotCreate, SlotUpdate
from app.services.reservation_service import (
    close_active_slot_reservations,
    create_slot_reservation_record,
)
from app.services.notification_service import EmailDeliveryError, send_email
from app.services.wallet_service import debit_wallet_for_slot_reservation, SLOT_RESERVATION_FEE


MIN_SLOT_DURATION_MINUTES = 20
MAX_SLOT_DURATION_MINUTES = 180
MIN_RESERVATION_LEAD_MINUTES = 15
MAX_RESERVATION_ADVANCE_DAYS = 7
NO_SHOW_RELEASE_MINUTES = 20
MAX_ACTIVE_RESERVATIONS_PER_USER = 2


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


def _validate_slot_business_window(start_time: datetime, end_time: datetime) -> None:
    now = datetime.now(tz=timezone.utc)
    duration_minutes = int((end_time - start_time).total_seconds() // 60)

    if start_time <= now:
        raise HTTPException(status_code=400, detail="Slot start_time must be in the future")

    if duration_minutes < MIN_SLOT_DURATION_MINUTES:
        raise HTTPException(
            status_code=400,
            detail=f"Slot duration must be at least {MIN_SLOT_DURATION_MINUTES} minutes",
        )

    if duration_minutes > MAX_SLOT_DURATION_MINUTES:
        raise HTTPException(
            status_code=400,
            detail=f"Slot duration cannot exceed {MAX_SLOT_DURATION_MINUTES} minutes",
        )


async def _refresh_slot_statuses(db: AsyncSession) -> None:
    """
    Keep slot statuses operationally realistic:
    - Close past slots.
    - Auto-release no-show reservations after grace from start_time.
    """
    now = datetime.now(tz=timezone.utc)
    result = await db.execute(
        select(ConnectorSlot).where(
            ConnectorSlot.status.in_([SlotStatus.OPEN, SlotStatus.RESERVED])
        )
    )
    slots = result.scalars().all()

    changed = False
    no_show_cutoff_seconds = NO_SHOW_RELEASE_MINUTES * 60

    for slot in slots:
        if slot.end_time <= now:
            if slot.status != SlotStatus.CLOSED:
                previous_status = slot.status
                slot.status = SlotStatus.CLOSED
                slot.reserved_by_user_id = None
                slot.reserved_by_user_name = None
                slot.reserved_by_email = None
                slot.reserved_by_phone_number = None
                slot.reserved_at = None
                if previous_status == SlotStatus.RESERVED:
                    await close_active_slot_reservations(db, slot.slot_id, ReservationStatus.COMPLETED)
                changed = True
            continue

        if slot.status == SlotStatus.RESERVED:
            elapsed_from_start = (now - slot.start_time).total_seconds()
            if elapsed_from_start >= no_show_cutoff_seconds:
                slot.status = SlotStatus.OPEN
                slot.reserved_by_user_id = None
                slot.reserved_by_user_name = None
                slot.reserved_by_email = None
                slot.reserved_by_phone_number = None
                slot.reserved_at = None
                await close_active_slot_reservations(db, slot.slot_id, ReservationStatus.EXPIRED)
                changed = True

    if changed:
        await db.commit()


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
    _validate_slot_business_window(start_dt, end_dt)

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


async def _get_station_slots(
    station_id: int,
    db: AsyncSession,
    slot_date: date | None = None,
) -> list[dict]:
    target_date = slot_date or datetime.now(tz=timezone.utc).date()
    day_start = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)

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
            func.coalesce(ConnectorSlot.reserved_by_user_name, User.user_name).label("reserved_by_user_name"),
            func.coalesce(ConnectorSlot.reserved_by_email, User.email).label("reserved_by_email"),
            func.coalesce(ConnectorSlot.reserved_by_phone_number, User.phone_number).label("reserved_by_phone_number"),
            ConnectorSlot.reserved_at,
            ConnectorSlot.created_by_manager_id,
            ConnectorSlot.created_at,
            ConnectorSlot.updated_at,
        )
        .join(Connector, Connector.connector_id == ConnectorSlot.connector_id)
        .join(Charger, Charger.charger_id == Connector.charger_id)
        .outerjoin(User, User.user_id == ConnectorSlot.reserved_by_user_id)
        .where(
            Charger.station_id == station_id,
            ConnectorSlot.start_time >= day_start,
            ConnectorSlot.start_time < day_end,
        )
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
    slot_date: date | None = None,
) -> list[dict]:
    await _refresh_slot_statuses(db)

    station_result = await db.execute(
        select(Station).where(Station.manager_id == current_manager.user_id)
    )
    station = station_result.scalar_one_or_none()

    if not station:
        return []

    return await _get_station_slots(station.station_id, db, slot_date)


async def get_slots_by_staff(
    current_staff: User,
    db: AsyncSession,
    slot_date: date | None = None,
) -> list[dict]:
    await _refresh_slot_statuses(db)

    if not current_staff.station_id:
        return []

    return await _get_station_slots(current_staff.station_id, db, slot_date)


async def get_slots_by_station(
    station_id: int,
    db: AsyncSession,
    slot_date: date | None = None,
) -> list[dict]:
    await _refresh_slot_statuses(db)
    return await _get_station_slots(station_id, db, slot_date)


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
    _validate_slot_business_window(start_dt, end_dt)
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
    slot.reserved_by_user_name = None
    slot.reserved_by_email = None
    slot.reserved_by_phone_number = None
    slot.reserved_at = None

    await close_active_slot_reservations(db, slot.slot_id, ReservationStatus.RELEASED)

    await db.commit()

    return {"message": "Slot reservation released successfully"}


async def _get_manager_reserved_slot_details(
    slot_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(
            ConnectorSlot.slot_id,
            ConnectorSlot.start_time,
            ConnectorSlot.end_time,
            ConnectorSlot.status,
            Connector.connector_number,
            Charger.name.label("charger_name"),
            Station.station_name,
            Station.address,
            func.coalesce(ConnectorSlot.reserved_by_user_name, User.user_name).label("reserved_by_user_name"),
            func.coalesce(ConnectorSlot.reserved_by_email, User.email).label("reserved_by_email"),
        )
        .join(Connector, Connector.connector_id == ConnectorSlot.connector_id)
        .join(Charger, Charger.charger_id == Connector.charger_id)
        .join(Station, Station.station_id == Charger.station_id)
        .outerjoin(User, User.user_id == ConnectorSlot.reserved_by_user_id)
        .where(
            ConnectorSlot.slot_id == slot_id,
            Station.manager_id == current_manager.user_id,
        )
    )
    slot = result.mappings().first()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    return dict(slot)


def _format_confirmation_datetime(value: datetime) -> str:
    normalized = value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return normalized.strftime("%d %b %Y, %I:%M %p UTC")


async def send_slot_confirmation_email_by_manager(
    slot_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    slot = await _get_manager_reserved_slot_details(slot_id, current_manager, db)

    if slot["status"] != SlotStatus.RESERVED:
        raise HTTPException(status_code=400, detail="Slot is not reserved")

    recipient_email = slot.get("reserved_by_email")
    if not recipient_email:
        raise HTTPException(status_code=400, detail="No email address available for this reservation")

    recipient_name = slot.get("reserved_by_user_name") or "Customer"
    subject = f"Click&Charge reservation confirmed for {slot['charger_name']}"
    body = (
        f"Hello {recipient_name},\n\n"
        f"Your reservation has been confirmed by the station manager.\n\n"
        f"Station: {slot['station_name']}\n"
        f"Address: {slot['address']}\n"
        f"Charger: {slot['charger_name']}\n"
        f"Connector: {slot['connector_number']}\n"
        f"Time: {_format_confirmation_datetime(slot['start_time'])} - {_format_confirmation_datetime(slot['end_time'])}\n\n"
        f"Please arrive on time and keep this email for reference.\n\n"
        f"Thank you,\n"
        f"Click&Charge"
    )

    try:
        await send_email(subject=subject, recipient_email=str(recipient_email), body_text=body)
    except EmailDeliveryError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"message": "Reservation confirmation email sent successfully"}


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
    slot.reserved_by_user_name = None
    slot.reserved_by_email = None
    slot.reserved_by_phone_number = None
    slot.reserved_at = None

    await close_active_slot_reservations(db, slot.slot_id, ReservationStatus.RELEASED)

    await db.commit()

    return {"message": "Slot reservation released successfully"}


async def reserve_slot_by_user(
    slot_id: int,
    current_user: User,
    db: AsyncSession,
) -> dict:
    await _refresh_slot_statuses(db)

    result = await db.execute(
        select(ConnectorSlot).where(ConnectorSlot.slot_id == slot_id)
    )
    slot = result.scalar_one_or_none()

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    if slot.status != SlotStatus.OPEN:
        raise HTTPException(status_code=400, detail="Slot is not available")

    now = datetime.now(tz=timezone.utc)
    lead_cutoff = now.timestamp() + (MIN_RESERVATION_LEAD_MINUTES * 60)

    if slot.start_time.timestamp() < lead_cutoff:
        raise HTTPException(
            status_code=400,
            detail=f"Reservation must be made at least {MIN_RESERVATION_LEAD_MINUTES} minutes before slot start",
        )

    max_advance_cutoff = now.timestamp() + (MAX_RESERVATION_ADVANCE_DAYS * 24 * 60 * 60)
    if slot.start_time.timestamp() > max_advance_cutoff:
        raise HTTPException(
            status_code=400,
            detail=f"Reservation cannot be made more than {MAX_RESERVATION_ADVANCE_DAYS} days in advance",
        )

    if slot.end_time <= now:
        raise HTTPException(status_code=400, detail="Cannot reserve a past slot")

    active_reservation_result = await db.execute(
        select(ConnectorSlot).where(
            ConnectorSlot.reserved_by_user_id == current_user.user_id,
            ConnectorSlot.status == SlotStatus.RESERVED,
            ConnectorSlot.end_time > now,
        )
    )
    active_reservations = active_reservation_result.scalars().all()
    if len(active_reservations) >= MAX_ACTIVE_RESERVATIONS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"You can hold up to {MAX_ACTIVE_RESERVATIONS_PER_USER} active reservations",
        )

    slot.status = SlotStatus.RESERVED
    slot.reserved_by_user_id = current_user.user_id
    slot.reserved_by_user_name = current_user.user_name
    slot.reserved_by_email = current_user.email
    slot.reserved_by_phone_number = current_user.phone_number
    slot.reserved_at = now

    manager_result = await db.execute(
        select(Station.manager_id)
        .join(Charger, Charger.station_id == Station.station_id)
        .join(Connector, Connector.charger_id == Charger.charger_id)
        .where(Connector.connector_id == slot.connector_id)
    )
    manager_user_id = manager_result.scalar_one_or_none()

    balance_after_payment = await debit_wallet_for_slot_reservation(
        current_user=current_user,
        db=db,
        slot_id=slot.slot_id,
        manager_user_id=manager_user_id,
    )

    await create_slot_reservation_record(db, slot, current_user, now)

    await db.commit()

    return {
        "message": "Slot reserved successfully",
        "paid_amount": float(SLOT_RESERVATION_FEE),
        "wallet_balance": float(balance_after_payment),
    }


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
    slot.reserved_by_user_name = None
    slot.reserved_by_email = None
    slot.reserved_by_phone_number = None
    slot.reserved_at = None

    await close_active_slot_reservations(db, slot.slot_id, ReservationStatus.CANCELLED)

    await db.commit()

    return {"message": "Slot reservation cancelled successfully"}
