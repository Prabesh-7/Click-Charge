from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.chargers import Charger
from app.models.stations import Station
from app.models.user import User
from app.schemas.charger import ChargerCreate


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
            status_code=404,
            detail="No station found for this manager",
        )

    charger = Charger(
        station_id=station.station_id,
        name=data.name,
        status=data.status,
        type=data.type,
    )

    db.add(charger)
    await db.commit()
    await db.refresh(charger)

    return charger

