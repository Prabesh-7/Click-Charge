from datetime import datetime, timezone

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.stations import Station
from app.models.chargers import Charger, Connector, ConnectorSlot
from app.models.reservation import Reservation, ReservationStatus, ReservationType
from app.models.user import User
from app.models.reservation_payment import ReservationPaymentRequest, ReservationPaymentStatus
from app.services.wallet_service import debit_wallet
from app.models.wallet import WalletTransactionSource


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
    pending_payment_subquery = (
        select(
            ReservationPaymentRequest.reservation_id.label("reservation_id"),
            func.coalesce(func.sum(ReservationPaymentRequest.amount), 0.0).label("pending_payment_amount"),
            func.count(ReservationPaymentRequest.payment_request_id).label("pending_payment_count"),
        )
        .where(ReservationPaymentRequest.status == ReservationPaymentStatus.PENDING)
        .group_by(ReservationPaymentRequest.reservation_id)
        .subquery()
    )

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
            pending_payment_subquery.c.pending_payment_amount,
            pending_payment_subquery.c.pending_payment_count,
        )
        .join(Charger, Charger.charger_id == Reservation.charger_id)
        .join(Connector, Connector.connector_id == Reservation.connector_id)
        .join(Station, Station.station_id == Reservation.station_id)
        .outerjoin(
            pending_payment_subquery,
            pending_payment_subquery.c.reservation_id == Reservation.reservation_id,
        )
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
        if item.get("pending_payment_amount") is not None:
            item["pending_payment_amount"] = float(item["pending_payment_amount"])
        if item.get("pending_payment_count") is not None:
            item["pending_payment_count"] = int(item["pending_payment_count"])
        normalized_rows.append(item)

    return normalized_rows


async def get_reservation_records_by_manager(
    current_manager: User,
    db: AsyncSession,
) -> list[dict]:
    manager_station_result = await db.execute(
        select(Station).where(Station.manager_id == current_manager.user_id)
    )
    station = manager_station_result.scalar_one_or_none()

    if not station:
        return []

    pending_payment_subquery = (
        select(
            ReservationPaymentRequest.reservation_id.label("reservation_id"),
            func.coalesce(func.sum(ReservationPaymentRequest.amount), 0.0).label("pending_payment_amount"),
            func.count(ReservationPaymentRequest.payment_request_id).label("pending_payment_count"),
        )
        .where(ReservationPaymentRequest.status == ReservationPaymentStatus.PENDING)
        .group_by(ReservationPaymentRequest.reservation_id)
        .subquery()
    )

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
            pending_payment_subquery.c.pending_payment_amount,
            pending_payment_subquery.c.pending_payment_count,
        )
        .join(Charger, Charger.charger_id == Reservation.charger_id)
        .join(Connector, Connector.connector_id == Reservation.connector_id)
        .join(Station, Station.station_id == Reservation.station_id)
        .outerjoin(
            pending_payment_subquery,
            pending_payment_subquery.c.reservation_id == Reservation.reservation_id,
        )
        .where(Reservation.station_id == station.station_id)
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
        if item.get("pending_payment_amount") is not None:
            item["pending_payment_amount"] = float(item["pending_payment_amount"])
        if item.get("pending_payment_count") is not None:
            item["pending_payment_count"] = int(item["pending_payment_count"])
        normalized_rows.append(item)

    return normalized_rows


async def create_reservation_payment_request_by_manager(
    reservation_id: int,
    amount: float,
    note: str | None,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    manager_station_result = await db.execute(
        select(Station).where(Station.manager_id == current_manager.user_id)
    )
    station = manager_station_result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail="No station assigned to this manager")

    reservation_result = await db.execute(
        select(Reservation).where(
            Reservation.reservation_id == reservation_id,
            Reservation.station_id == station.station_id,
        )
    )
    reservation = reservation_result.scalar_one_or_none()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    if reservation.reserved_by_user_id is None:
        raise HTTPException(status_code=400, detail="Reservation has no user to charge")

    payment_request = ReservationPaymentRequest(
        reservation_id=reservation.reservation_id,
        station_id=station.station_id,
        manager_user_id=current_manager.user_id,
        user_id=reservation.reserved_by_user_id,
        amount=float(amount),
        currency="NPR",
        note=note,
        status=ReservationPaymentStatus.PENDING,
    )
    db.add(payment_request)
    await db.commit()
    await db.refresh(payment_request)

    return {
        "message": "Payment request sent to user",
        "payment_request_id": payment_request.payment_request_id,
        "reservation_id": reservation.reservation_id,
        "amount": float(payment_request.amount),
        "status": payment_request.status.value,
    }


async def pay_pending_reservation_amount_by_user(
    reservation_id: int,
    current_user: User,
    db: AsyncSession,
) -> dict:
    reservation_result = await db.execute(
        select(Reservation).where(
            Reservation.reservation_id == reservation_id,
            Reservation.reserved_by_user_id == current_user.user_id,
        )
    )
    reservation = reservation_result.scalar_one_or_none()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    pending_result = await db.execute(
        select(ReservationPaymentRequest)
        .where(
            ReservationPaymentRequest.reservation_id == reservation_id,
            ReservationPaymentRequest.user_id == current_user.user_id,
            ReservationPaymentRequest.status == ReservationPaymentStatus.PENDING,
        )
        .order_by(ReservationPaymentRequest.requested_at.asc())
    )
    pending_requests = pending_result.scalars().all()

    if not pending_requests:
        raise HTTPException(status_code=400, detail="No pending payment found for this reservation")

    total_pending = float(sum(float(item.amount or 0.0) for item in pending_requests))

    new_balance = await debit_wallet(
        current_user=current_user,
        db=db,
        amount=total_pending,
        source=WalletTransactionSource.MANUAL,
        description=f"Reservation pending payment for reservation {reservation_id}",
        reference=f"reservation-{reservation_id}-pending",
    )

    paid_at = datetime.now(tz=timezone.utc)
    for payment_request in pending_requests:
        payment_request.status = ReservationPaymentStatus.PAID
        payment_request.paid_at = paid_at

    await db.commit()

    return {
        "message": "Pending reservation payment paid from wallet",
        "reservation_id": reservation_id,
        "paid_amount": round(total_pending, 2),
        "remaining_balance": float(new_balance),
    }
