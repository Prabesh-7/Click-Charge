from pydantic import BaseModel
from typing import Optional


class ManagerCreate(BaseModel):
    user_name: str
    email: str
    password: str
    phone_number: Optional[str] = None


class StationCreate(BaseModel):
    station_name: str
    address: str
    longitude: float
    latitude: float
    total_charger: int


class ManagerWithStationCreate(BaseModel):
    manager: ManagerCreate
    station: StationCreate