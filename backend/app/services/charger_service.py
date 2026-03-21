from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from typing import List
from datetime import datetime, timezone

from app.models.chargers import Charger, ChargerStatus, ChargerType
from app.models.stations import Station
from app.models.user import User
from app.schemas.charger import ChargerCreate, ChargerOut, ChargerMeterValues
from app.services.ocpp_service import ocpp_simulator


async def add_charger_by_manager(
    data: ChargerCreate,
    current_manager: User,
    db: AsyncSession
):
    # Manager adds charger to their own station (no station_id needed from client)
    result = await db.execute(
        select(Station).where(Station.manager_id == current_manager.user_id)
    )
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(
            status_code=400,
            detail="No station assigned to this manager. Ask admin to assign a station first.",
        )

    charge_point_id = data.charge_point_id

    # Keep API simple: if not provided, generate a unique charge point id.
    if not charge_point_id:
        suffix = int(datetime.now(tz=timezone.utc).timestamp())
        charge_point_id = f"CP-{current_manager.user_id}-{suffix}"

    charger = Charger(
        station_id=station.station_id,
        name=data.name,
        charge_point_id=charge_point_id,
        status=data.status or ChargerStatus.AVAILABLE,  # default if not provided
        type=data.type,
        max_power_kw=data.max_power_kw or 50,      # new field with default
        current_transaction_id=data.current_transaction_id  # optional field
    )

    db.add(charger)
    await db.commit()
    await db.refresh(charger)

    return charger


async def get_chargers_by_manager(
    current_manager: User,
    db: AsyncSession
) -> List[ChargerOut]:
    # Get manager's station
    result = await db.execute(
        select(Station).where(Station.manager_id == current_manager.user_id)
    )
    station = result.scalar_one_or_none()

    if not station:
        return []

    # Get all chargers for this station
    result = await db.execute(
        select(Charger).where(Charger.station_id == station.station_id)
    )
    chargers = result.scalars().all()

    return [ChargerOut.model_validate(charger) for charger in chargers]


async def _get_manager_charger(
    charger_id: int,
    current_manager: User,
    db: AsyncSession,
) -> Charger:
    # Ensure manager can only control chargers from their own station.
    result = await db.execute(
        select(Charger)
        .join(Station, Charger.station_id == Station.station_id)
        .where(
            Charger.charger_id == charger_id,
            Station.manager_id == current_manager.user_id,
        )
    )
    charger = result.scalar_one_or_none()

    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")

    return charger


async def start_charging_by_manager(
    charger_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    charger = await _get_manager_charger(charger_id, current_manager, db)

    if charger.status == ChargerStatus.IN_CHARGING:
        raise HTTPException(status_code=400, detail="Charger is already charging")

    # Simple OCPP simulation transaction id.
    transaction_id = int(datetime.now(tz=timezone.utc).timestamp())

    charger.status = ChargerStatus.IN_CHARGING
    charger.current_transaction_id = transaction_id
    charger.last_status_change = datetime.now(tz=timezone.utc)

    await db.commit()
    await db.refresh(charger)

    return {
        "charger": ChargerOut.model_validate(charger),
        "message": "Charging started",
    }


async def stop_charging_by_manager(
    charger_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    charger = await _get_manager_charger(charger_id, current_manager, db)

    if charger.status != ChargerStatus.IN_CHARGING:
        raise HTTPException(status_code=400, detail="Charger is not in charging state")

    charger.status = ChargerStatus.AVAILABLE
    charger.current_transaction_id = None
    charger.last_status_change = datetime.now(tz=timezone.utc)

    await db.commit()
    await db.refresh(charger)

    return {
        "charger": ChargerOut.model_validate(charger),
        "message": "Charging stopped",
    }

async def get_meter_values_by_manager(
    charger_id: int,
    current_manager: User,
    db: AsyncSession,
) -> ChargerMeterValues:
    charger = await _get_manager_charger(charger_id, current_manager, db)

    live_values = ocpp_simulator.get_meter_values(charger.charge_point_id)
    if live_values:
        status_map = {
            "Available": ChargerStatus.AVAILABLE,
            "Charging": ChargerStatus.IN_CHARGING,
            "Reserved": ChargerStatus.RESERVED,
        }

        live_status = status_map.get(live_values.get("status"), charger.status)
        live_timestamp_raw = live_values.get("timestamp")

        try:
            live_timestamp = (
                datetime.fromisoformat(live_timestamp_raw)
                if isinstance(live_timestamp_raw, str)
                else datetime.now(tz=timezone.utc)
            )
        except Exception:
            live_timestamp = datetime.now(tz=timezone.utc)

        return ChargerMeterValues(
            charger_id=charger.charger_id,
            charge_point_id=charger.charge_point_id,
            status=live_status,
            transaction_id=live_values.get("transaction_id") or charger.current_transaction_id,
            power_kw=round(float(live_values.get("power_kw", 0.0)), 2),
            voltage_v=round(float(live_values.get("voltage_v", 0.0)), 2),
            current_a=round(float(live_values.get("current_a", 0.0)), 2),
            energy_kwh=round(float(live_values.get("energy_kwh", 0.0)), 3),
            timestamp=live_timestamp,
        )

    now = datetime.now(tz=timezone.utc)

    if charger.status == ChargerStatus.IN_CHARGING and charger.last_status_change:
        elapsed_hours = (now - charger.last_status_change).total_seconds() / 3600
        energy_kwh = max(0.0, round(charger.max_power_kw * elapsed_hours, 3))
        power_kw = float(charger.max_power_kw)
    else:
        energy_kwh = 0.0
        power_kw = 0.0

    # Basic simulator assumptions for demo OCPP meter values.
    voltage_v = 400.0 if charger.type in [ChargerType.CCS2, ChargerType.CHADEMO] else 230.0
    current_a = round((power_kw * 1000 / voltage_v), 2) if power_kw > 0 else 0.0

    return ChargerMeterValues(
        charger_id=charger.charger_id,
        charge_point_id=charger.charge_point_id,
        status=charger.status,
        transaction_id=charger.current_transaction_id,
        power_kw=round(power_kw, 2),
        voltage_v=voltage_v,
        current_a=current_a,
        energy_kwh=energy_kwh,
        timestamp=now,
    )