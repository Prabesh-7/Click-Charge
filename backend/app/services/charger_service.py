from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from uuid import uuid4
import math

from app.models.chargers import Charger, Connector, ChargerStatus, ChargerType
from app.models.stations import Station
from app.models.user import User
from app.schemas.charger import ChargerCreate, ChargerOut, ChargerMeterValues
from app.services.ocpp_service import ocpp_simulator


DEFAULT_PRICE_PER_KWH = 12.0
DEFAULT_CURRENCY = "INR"


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

    connector_count = data.connector_count or 1
    if connector_count < 1:
        raise HTTPException(status_code=400, detail="connector_count must be at least 1")

    generated_primary_cpid = _build_connector_charge_point_id(0, 1)

    charger = Charger(
        station_id=station.station_id,
        name=data.name,
        charge_point_id=generated_primary_cpid,
        status=data.status or ChargerStatus.AVAILABLE,  # default if not provided
        type=data.type,
        max_power_kw=data.max_power_kw or 50,      # new field with default
        current_transaction_id=data.current_transaction_id  # optional field
    )

    db.add(charger)

    # Flush first to get charger_id for deterministic connector ids.
    await db.flush()

    connectors: list[Connector] = []
    for connector_number in range(1, connector_count + 1):
        connector = Connector(
            charger_id=charger.charger_id,
            connector_number=connector_number,
            charge_point_id=_build_connector_charge_point_id(charger.charger_id, connector_number),
            status=charger.status,
            current_transaction_id=charger.current_transaction_id,
        )
        db.add(connector)
        connectors.append(connector)

    if connectors:
        # Keep legacy charger-level charge_point_id mapped to connector 1.
        charger.charge_point_id = connectors[0].charge_point_id

    await db.commit()
    await db.refresh(charger)
    await db.refresh(charger, attribute_names=["connectors"])

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
        select(Charger)
        .options(selectinload(Charger.connectors))
        .where(Charger.station_id == station.station_id)
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
        .options(selectinload(Charger.connectors))
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


def _build_connector_charge_point_id(charger_id: int, connector_number: int) -> str:
    token = uuid4().hex[:8].upper()
    return f"CP-{charger_id}-{connector_number}-{token}"


async def _resolve_connector_for_charger(
    charger: Charger,
    db: AsyncSession,
    connector_id: Optional[int],
) -> Connector:
    if connector_id is not None:
        result = await db.execute(
            select(Connector).where(
                Connector.connector_id == connector_id,
                Connector.charger_id == charger.charger_id,
            )
        )
        connector = result.scalar_one_or_none()
        if not connector:
            raise HTTPException(status_code=404, detail="Connector not found")
        return connector

    result = await db.execute(
        select(Connector)
        .where(Connector.charger_id == charger.charger_id)
        .order_by(Connector.connector_number.asc())
    )
    connector = result.scalars().first()

    if not connector:
        raise HTTPException(status_code=404, detail="No connector found for charger")

    return connector


def _sync_charger_state_from_connectors(charger: Charger, connectors: list[Connector]) -> None:
    active_connector = next((c for c in connectors if c.status == ChargerStatus.IN_CHARGING), None)

    if active_connector:
        charger.status = ChargerStatus.IN_CHARGING
        charger.current_transaction_id = active_connector.current_transaction_id
        charger.charge_point_id = active_connector.charge_point_id
        charger.last_status_change = active_connector.last_status_change
        return

    first_connector = connectors[0] if connectors else None
    charger.status = ChargerStatus.AVAILABLE
    charger.current_transaction_id = None
    if first_connector:
        charger.charge_point_id = first_connector.charge_point_id
        charger.last_status_change = first_connector.last_status_change


async def _get_charger_connectors(charger: Charger, db: AsyncSession) -> list[Connector]:
    result = await db.execute(
        select(Connector)
        .where(Connector.charger_id == charger.charger_id)
        .order_by(Connector.connector_number.asc())
    )
    return list(result.scalars().all())


async def _get_live_or_computed_meter_values(
    charger: Charger,
    connector: Connector,
) -> Tuple[ChargerStatus, Optional[int], float, float, float, float, float, float, float, float, float, datetime]:
    live_values = ocpp_simulator.get_meter_values(connector.charge_point_id)
    if live_values:
        status_map = {
            "Available": ChargerStatus.AVAILABLE,
            "Charging": ChargerStatus.IN_CHARGING,
            "Reserved": ChargerStatus.RESERVED,
        }

        live_status = status_map.get(live_values.get("status"), connector.status)
        live_timestamp_raw = live_values.get("timestamp")

        try:
            live_timestamp = (
                datetime.fromisoformat(live_timestamp_raw)
                if isinstance(live_timestamp_raw, str)
                else datetime.now(tz=timezone.utc)
            )
        except Exception:
            live_timestamp = datetime.now(tz=timezone.utc)

        return (
            live_status,
            live_values.get("transaction_id") or connector.current_transaction_id,
            round(float(live_values.get("power_kw", 0.0)), 2),
            round(float(live_values.get("reactive_power_kvar", 0.0)), 2),
            round(float(live_values.get("voltage_v", 0.0)), 2),
            round(float(live_values.get("current_a", 0.0)), 2),
            round(float(live_values.get("power_factor", 1.0)), 3),
            round(float(live_values.get("frequency_hz", 50.0)), 2),
            round(float(live_values.get("energy_kwh", 0.0)), 3),
            round(float(live_values.get("reactive_energy_kvarh", 0.0)), 3),
            round(float(live_values.get("temperature_c", 0.0)), 2),
            round(float(live_values.get("soc_percent", 0.0)), 2),
            live_timestamp,
        )

    now = datetime.now(tz=timezone.utc)

    if connector.status == ChargerStatus.IN_CHARGING and connector.last_status_change:
        elapsed_hours = (now - connector.last_status_change).total_seconds() / 3600
        energy_kwh = max(0.0, round(charger.max_power_kw * elapsed_hours, 3))
        power_kw = float(charger.max_power_kw)
        temperature_c = 32.0 + min(18.0, elapsed_hours * 3.5)
        soc_percent = min(100.0, 20.0 + (energy_kwh / 60.0) * 100.0)
    else:
        energy_kwh = 0.0
        power_kw = 0.0
        temperature_c = 27.0
        soc_percent = 20.0

    power_factor = 0.98 if power_kw > 0 else 1.0
    reactive_power_kvar = round(power_kw * math.tan(math.acos(power_factor)), 2) if power_kw > 0 else 0.0
    reactive_energy_kvarh = round(energy_kwh * 0.25, 3)
    frequency_hz = 50.0

    voltage_v = 400.0 if charger.type in [ChargerType.CCS2, ChargerType.CHADEMO] else 230.0
    current_a = round((power_kw * 1000 / voltage_v), 2) if power_kw > 0 else 0.0

    return (
        connector.status,
        connector.current_transaction_id,
        round(power_kw, 2),
        reactive_power_kvar,
        voltage_v,
        current_a,
        power_factor,
        frequency_hz,
        energy_kwh,
        reactive_energy_kvarh,
        round(temperature_c, 2),
        round(soc_percent, 2),
        now,
    )


async def start_charging_by_manager(
    charger_id: int,
    connector_id: Optional[int],
    current_manager: User,
    db: AsyncSession,
) -> dict:
    charger = await _get_manager_charger(charger_id, current_manager, db)
    connector = await _resolve_connector_for_charger(charger, db, connector_id)

    if connector.status == ChargerStatus.IN_CHARGING:
        raise HTTPException(status_code=400, detail="Connector is already charging")

    # Simple OCPP simulation transaction id.
    transaction_id = int(datetime.now(tz=timezone.utc).timestamp())

    connector.status = ChargerStatus.IN_CHARGING
    connector.current_transaction_id = transaction_id
    connector.last_status_change = datetime.now(tz=timezone.utc)

    connectors = await _get_charger_connectors(charger, db)
    _sync_charger_state_from_connectors(charger, connectors)

    await db.commit()
    await db.refresh(charger)
    await db.refresh(charger, attribute_names=["connectors"])

    return {
        "charger": ChargerOut.model_validate(charger),
        "message": f"Charging started on connector {connector.connector_number}",
    }


async def stop_charging_by_manager(
    charger_id: int,
    connector_id: Optional[int],
    current_manager: User,
    db: AsyncSession,
) -> dict:
    charger = await _get_manager_charger(charger_id, current_manager, db)
    connector = await _resolve_connector_for_charger(charger, db, connector_id)

    if connector.status != ChargerStatus.IN_CHARGING:
        raise HTTPException(status_code=400, detail="Connector is not in charging state")

    (
        _,
        _,
        _,
        _,
        _,
        _,
        _,
        _,
        energy_kwh,
        _,
        _,
        _,
        _,
    ) = await _get_live_or_computed_meter_values(charger, connector)

    total_amount = round(energy_kwh * DEFAULT_PRICE_PER_KWH, 2)

    connector.status = ChargerStatus.AVAILABLE
    connector.current_transaction_id = None
    connector.last_status_change = datetime.now(tz=timezone.utc)

    connectors = await _get_charger_connectors(charger, db)
    _sync_charger_state_from_connectors(charger, connectors)

    await db.commit()
    await db.refresh(charger)
    await db.refresh(charger, attribute_names=["connectors"])

    return {
        "charger": ChargerOut.model_validate(charger),
        "message": (
            f"Charging stopped on connector {connector.connector_number}. "
            f"Total amount: {DEFAULT_CURRENCY} {total_amount}"
        ),
        "total_energy_kwh": round(energy_kwh, 3),
        "price_per_kwh": DEFAULT_PRICE_PER_KWH,
        "total_amount": total_amount,
        "currency": DEFAULT_CURRENCY,
    }

async def get_meter_values_by_manager(
    charger_id: int,
    connector_id: Optional[int],
    current_manager: User,
    db: AsyncSession,
) -> ChargerMeterValues:
    charger = await _get_manager_charger(charger_id, current_manager, db)
    connector = await _resolve_connector_for_charger(charger, db, connector_id)

    (
        status,
        transaction_id,
        power_kw,
        reactive_power_kvar,
        voltage_v,
        current_a,
        power_factor,
        frequency_hz,
        energy_kwh,
        reactive_energy_kvarh,
        temperature_c,
        soc_percent,
        timestamp,
    ) = await _get_live_or_computed_meter_values(charger, connector)

    return ChargerMeterValues(
        charger_id=charger.charger_id,
        connector_id=connector.connector_id,
        connector_number=connector.connector_number,
        charge_point_id=connector.charge_point_id,
        status=status,
        transaction_id=transaction_id,
        power_kw=power_kw,
        reactive_power_kvar=reactive_power_kvar,
        voltage_v=voltage_v,
        current_a=current_a,
        power_factor=power_factor,
        frequency_hz=frequency_hz,
        energy_kwh=energy_kwh,
        reactive_energy_kvarh=reactive_energy_kvarh,
        temperature_c=temperature_c,
        soc_percent=soc_percent,
        timestamp=timestamp,
    )


async def get_chargers_by_staff(
    current_staff: User,
    db: AsyncSession,
) -> List[ChargerOut]:
    if not current_staff.station_id:
        return []

    result = await db.execute(
        select(Charger)
        .options(selectinload(Charger.connectors))
        .where(Charger.station_id == current_staff.station_id)
    )
    chargers = result.scalars().all()

    return [ChargerOut.model_validate(charger) for charger in chargers]


async def _get_staff_charger(
    charger_id: int,
    current_staff: User,
    db: AsyncSession,
) -> Charger:
    if not current_staff.station_id:
        raise HTTPException(status_code=404, detail="Staff is not assigned to any station")

    result = await db.execute(
        select(Charger)
        .options(selectinload(Charger.connectors))
        .where(
            Charger.charger_id == charger_id,
            Charger.station_id == current_staff.station_id,
        )
    )
    charger = result.scalar_one_or_none()

    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")

    return charger


async def start_charging_by_staff(
    charger_id: int,
    connector_id: Optional[int],
    current_staff: User,
    db: AsyncSession,
) -> dict:
    charger = await _get_staff_charger(charger_id, current_staff, db)
    connector = await _resolve_connector_for_charger(charger, db, connector_id)

    if connector.status == ChargerStatus.IN_CHARGING:
        raise HTTPException(status_code=400, detail="Connector is already charging")

    transaction_id = int(datetime.now(tz=timezone.utc).timestamp())

    connector.status = ChargerStatus.IN_CHARGING
    connector.current_transaction_id = transaction_id
    connector.last_status_change = datetime.now(tz=timezone.utc)

    connectors = await _get_charger_connectors(charger, db)
    _sync_charger_state_from_connectors(charger, connectors)

    await db.commit()
    await db.refresh(charger)
    await db.refresh(charger, attribute_names=["connectors"])

    return {
        "charger": ChargerOut.model_validate(charger),
        "message": f"Charging started on connector {connector.connector_number}",
    }


async def stop_charging_by_staff(
    charger_id: int,
    connector_id: Optional[int],
    current_staff: User,
    db: AsyncSession,
) -> dict:
    charger = await _get_staff_charger(charger_id, current_staff, db)
    connector = await _resolve_connector_for_charger(charger, db, connector_id)

    if connector.status != ChargerStatus.IN_CHARGING:
        raise HTTPException(status_code=400, detail="Connector is not in charging state")

    (
        _,
        _,
        _,
        _,
        _,
        _,
        _,
        _,
        energy_kwh,
        _,
        _,
        _,
        _,
    ) = await _get_live_or_computed_meter_values(charger, connector)

    total_amount = round(energy_kwh * DEFAULT_PRICE_PER_KWH, 2)

    connector.status = ChargerStatus.AVAILABLE
    connector.current_transaction_id = None
    connector.last_status_change = datetime.now(tz=timezone.utc)

    connectors = await _get_charger_connectors(charger, db)
    _sync_charger_state_from_connectors(charger, connectors)

    await db.commit()
    await db.refresh(charger)
    await db.refresh(charger, attribute_names=["connectors"])

    return {
        "charger": ChargerOut.model_validate(charger),
        "message": (
            f"Charging stopped on connector {connector.connector_number}. "
            f"Total amount: {DEFAULT_CURRENCY} {total_amount}"
        ),
        "total_energy_kwh": round(energy_kwh, 3),
        "price_per_kwh": DEFAULT_PRICE_PER_KWH,
        "total_amount": total_amount,
        "currency": DEFAULT_CURRENCY,
    }


async def get_meter_values_by_staff(
    charger_id: int,
    connector_id: Optional[int],
    current_staff: User,
    db: AsyncSession,
) -> ChargerMeterValues:
    charger = await _get_staff_charger(charger_id, current_staff, db)
    connector = await _resolve_connector_for_charger(charger, db, connector_id)

    (
        status,
        transaction_id,
        power_kw,
        reactive_power_kvar,
        voltage_v,
        current_a,
        power_factor,
        frequency_hz,
        energy_kwh,
        reactive_energy_kvarh,
        temperature_c,
        soc_percent,
        timestamp,
    ) = await _get_live_or_computed_meter_values(charger, connector)

    return ChargerMeterValues(
        charger_id=charger.charger_id,
        connector_id=connector.connector_id,
        connector_number=connector.connector_number,
        charge_point_id=connector.charge_point_id,
        status=status,
        transaction_id=transaction_id,
        power_kw=power_kw,
        reactive_power_kvar=reactive_power_kvar,
        voltage_v=voltage_v,
        current_a=current_a,
        power_factor=power_factor,
        frequency_hz=frequency_hz,
        energy_kwh=energy_kwh,
        reactive_energy_kvarh=reactive_energy_kvarh,
        temperature_c=temperature_c,
        soc_percent=soc_percent,
        timestamp=timestamp,
    )


async def edit_charger_by_manager(
    charger_id: int,
    data: ChargerCreate,
    current_manager: User,
    db: AsyncSession,
):
    charger = await _get_manager_charger(charger_id, current_manager, db)

    # Update only provided fields
    if data.name:
        charger.name = data.name
    if data.type:
        charger.type = data.type
    if data.max_power_kw:
        charger.max_power_kw = data.max_power_kw
    if data.status:
        charger.status = data.status
    if data.current_transaction_id is not None:
        charger.current_transaction_id = data.current_transaction_id

    await db.commit()
    await db.refresh(charger)
    await db.refresh(charger, attribute_names=["connectors"])

    return charger


async def delete_charger_by_manager(
    charger_id: int,
    current_manager: User,
    db: AsyncSession,
) -> dict:
    charger = await _get_manager_charger(charger_id, current_manager, db)

    await db.delete(charger)
    await db.commit()

    return {"message": "Charger deleted successfully"}