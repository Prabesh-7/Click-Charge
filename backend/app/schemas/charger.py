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
    connector_count: Optional[int] = 1
    max_power_kw: Optional[int] = 50  # default if not provided
    current_transaction_id: Optional[int] = None  # optional

    @field_validator("connector_count")
    @classmethod
    def connector_count_must_be_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("connector_count must be at least 1")
        return v

    @model_validator(mode="after")
    def set_defaults_for_simple_payload(self):
        if self.connector_count is None:
            self.connector_count = 1
        return self


class ConnectorOut(BaseModel):
    connector_id: int
    connector_number: int
    charge_point_id: str
    status: ChargerStatus
    current_transaction_id: Optional[int] = None
    created_at: datetime
    last_status_change: datetime

    class Config:
        from_attributes = True


class ChargerOut(BaseModel):
    charger_id: int
    station_id: int
    name: str
    charge_point_id: str
    status: ChargerStatus
    type: ChargerType
    max_power_kw: int
    current_transaction_id: Optional[int] = None
    connectors: list[ConnectorOut] = []
    created_at: datetime
    last_status_change: datetime

    class Config:
        from_attributes = True


class ChargerControlResponse(BaseModel):
    charger: ChargerOut
    message: str
    total_energy_kwh: Optional[float] = None
    price_per_kwh: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None


class ChargerMeterValues(BaseModel):
    charger_id: int
    connector_id: Optional[int] = None
    connector_number: Optional[int] = None
    charge_point_id: str
    status: ChargerStatus
    transaction_id: Optional[int] = None
    power_kw: float
    reactive_power_kvar: float
    voltage_v: float
    current_a: float
    power_factor: float
    frequency_hz: float
    energy_kwh: float
    reactive_energy_kvarh: float
    temperature_c: float
    soc_percent: float
    timestamp: datetime