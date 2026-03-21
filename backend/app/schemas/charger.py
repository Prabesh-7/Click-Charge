from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import datetime
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
    charge_point_id: Optional[str] = None
    max_power_kw: Optional[int] = 50  # default if not provided
    current_transaction_id: Optional[int] = None  # optional

    @field_validator("charge_point_id")
    @classmethod
    def charge_point_id_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("charge_point_id cannot be empty")
        return v

    @model_validator(mode="after")
    def set_defaults_for_simple_payload(self):
        if self.charge_point_id is None:
            clean_name = "".join(ch for ch in self.name.upper() if ch.isalnum())
            self.charge_point_id = f"CP-{clean_name[:20] or 'CHARGER'}"
        return self


class ChargerOut(BaseModel):
    charger_id: int
    station_id: int
    name: str
    charge_point_id: str
    status: ChargerStatus
    type: ChargerType
    max_power_kw: int
    current_transaction_id: Optional[int] = None
    created_at: datetime
    last_status_change: datetime

    class Config:
        from_attributes = True


class ChargerControlResponse(BaseModel):
    charger: ChargerOut
    message: str


class ChargerMeterValues(BaseModel):
    charger_id: int
    charge_point_id: str
    status: ChargerStatus
    transaction_id: Optional[int] = None
    power_kw: float
    voltage_v: float
    current_a: float
    energy_kwh: float
    timestamp: datetime