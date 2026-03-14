from pydantic import BaseModel, field_validator
from typing import Optional
from app.models.chargers import ChargerStatus, ChargerType


class ChargerBase(BaseModel):
    name: str
    status: Optional[ChargerStatus] = ChargerStatus.AVAILABLE
    type: ChargerType

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Charger name is required")
        return v


class ChargerCreate(ChargerBase):
    pass


class ChargerOut(BaseModel):
    charger_id: int
    station_id: int
    name: str
    status: ChargerStatus
    type: ChargerType

    class Config:
        from_attributes = True

