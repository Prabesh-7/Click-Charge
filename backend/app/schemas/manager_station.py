from pydantic import BaseModel, Field
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
    station_description: Optional[str] = None
    phone_number: Optional[str] = None
    has_wifi: bool = False
    has_parking: bool = False
    has_food: bool = False
    has_coffee: bool = False
    has_bedroom: bool = False
    has_restroom: bool = False
    station_images: list[str] = Field(default_factory=list)


class ManagerStationUpdate(BaseModel):
    station_description: Optional[str] = None
    phone_number: Optional[str] = None
    has_wifi: Optional[bool] = None
    has_parking: Optional[bool] = None
    has_food: Optional[bool] = None
    has_coffee: Optional[bool] = None
    has_bedroom: Optional[bool] = None
    has_restroom: Optional[bool] = None
    station_images: Optional[list[str]] = None


class StationOut(BaseModel):
    station_id: int
    station_name: str
    address: str
    longitude: float
    latitude: float
    total_charger: int
    station_description: Optional[str] = None
    phone_number: Optional[str] = None
    has_wifi: bool = False
    has_parking: bool = False
    has_food: bool = False
    has_coffee: bool = False
    has_bedroom: bool = False
    has_restroom: bool = False
    station_images: list[str] = Field(default_factory=list)
    manager_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ManagerWithStationCreate(BaseModel):
    manager: ManagerCreate
    station: StationCreate