from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.user import User, UserRole
from app.models.stations import Station
from app.schemas.manager_station import ManagerWithStationCreate



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
        longitude=data.station.longitude,
        latitude=data.station.latitude,
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