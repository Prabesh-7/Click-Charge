from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from typing import List

from app.models.user import User, UserRole
from app.models.stations import Station
from app.schemas.manager_station import ManagerWithStationCreate, StationOut, StationCreate



async def create_manager_with_station(data: ManagerWithStationCreate, db: AsyncSession):
    # Check if email already exists
    result = await db.execute(select(User).filter(User.email == data.manager.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Create manager
    manager = User(
        user_name=data.manager.user_name,
        email=data.manager.email,
        password=data.manager.password,
        phone_number=data.manager.phone_number,
        role=UserRole.MANAGER
    )

    db.add(manager)
    await db.flush()  # get manager.user_id before commit

    # Create station
    station = Station(
        station_name=data.station.station_name,
        address=data.station.address,
        location=func.ST_SetSRID(
            func.ST_MakePoint(data.station.longitude, data.station.latitude),
            4326
        ),
        total_charger=data.station.total_charger,
        manager_id=manager.user_id
    )

    db.add(station)
    await db.commit()
    await db.refresh(manager)
    await db.refresh(station)

    return {
        "manager_id": manager.user_id,
        "station_id": station.station_id,
        "message": "Manager and station created successfully"
    }


async def get_all_stations(db: AsyncSession) -> List[StationOut]:
    """
    Get all stations in the system.
    """
    result = await db.execute(
        select(
            Station.station_id,
            Station.station_name,
            Station.address,
            func.ST_X(Station.location).label("longitude"),
            func.ST_Y(Station.location).label("latitude"),
            Station.total_charger,
            Station.manager_id,
            Station.created_at,
        )
    )
    stations = result.mappings().all()

    return [StationOut.model_validate(station) for station in stations]


async def edit_station(
    station_id: int,
    data: StationCreate,
    db: AsyncSession,
):
    """
    Edit station details.
    """
    result = await db.execute(
        select(Station).where(Station.station_id == station_id)
    )
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    # Update only provided fields
    if data.station_name:
        station.station_name = data.station_name
    if data.address:
        station.address = data.address
    if data.longitude and data.latitude:
        station.location = func.ST_SetSRID(
            func.ST_MakePoint(data.longitude, data.latitude),
            4326
        )
    if data.total_charger:
        station.total_charger = data.total_charger

    await db.commit()

    # Query again to get updated station with correct geometry conversion
    result = await db.execute(
        select(
            Station.station_id,
            Station.station_name,
            Station.address,
            func.ST_X(Station.location).label("longitude"),
            func.ST_Y(Station.location).label("latitude"),
            Station.total_charger,
            Station.manager_id,
            Station.created_at,
        ).where(Station.station_id == station_id)
    )
    updated_station = result.mappings().one_or_none()

    return StationOut.model_validate(updated_station)


async def delete_station(
    station_id: int,
    db: AsyncSession,
) -> dict:
    """
    Delete a station.
    """
    result = await db.execute(
        select(Station).where(Station.station_id == station_id)
    )
    station = result.scalar_one_or_none()

    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    await db.delete(station)
    await db.commit()

    return {"message": "Station deleted successfully"}
