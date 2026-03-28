from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserStationOut(BaseModel):
    station_id: int
    station_name: str
    address: str
    longitude: float
    latitude: float
    station_description: Optional[str] = None
    phone_number: Optional[str] = None
    has_wifi: bool = False
    has_parking: bool = False
    has_food: bool = False
    has_coffee: bool = False
    has_bedroom: bool = False
    has_restroom: bool = False
    station_images: list[str] = Field(default_factory=list)
    total_chargers: int = 0
    available_chargers: int = 0
    charger_types: list[str] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True
