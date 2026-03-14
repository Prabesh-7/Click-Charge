from pydantic import BaseModel
from typing import Optional
from datetime import datetime


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


class StationOut(BaseModel):
    station_id: int
    station_name: str
    address: str
    longitude: float
    latitude: float
    total_charger: int
    manager_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ManagerWithStationCreate(BaseModel):
    manager: ManagerCreate
    station: StationCreate