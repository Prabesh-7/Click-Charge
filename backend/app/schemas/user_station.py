from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserStationConnectorOut(BaseModel):
    connector_id: int
    connector_number: int
    status: str
    current_transaction_id: Optional[int] = None


class UserStationChargerOut(BaseModel):
    charger_id: int
    name: str
    type: str
    status: str
    total_connectors: int = 0
    available_connectors: int = 0
    connectors: list[UserStationConnectorOut] = Field(default_factory=list)


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
    total_connectors: int = 0
    available_connectors: int = 0
    charger_types: list[str] = Field(default_factory=list)
    chargers: list[UserStationChargerOut] = Field(default_factory=list)
    created_at: datetime

    class Config:
        from_attributes = True
