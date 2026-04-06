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
    price_per_kwh: Optional[float] = 12.0
    current_transaction_id: Optional[int] = None  # optional

    @field_validator("connector_count")
    @classmethod
    def connector_count_must_be_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("connector_count must be at least 1")
        return v

    @field_validator("price_per_kwh")
    @classmethod
    def price_per_kwh_must_be_valid(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("price_per_kwh must be zero or greater")
        return v

    @model_validator(mode="after")
    def set_defaults_for_simple_payload(self):
        if self.connector_count is None:
            self.connector_count = 1
        if self.price_per_kwh is None:
            self.price_per_kwh = 12.0
        return self


class ChargerPricingUpdate(BaseModel):
    price_per_kwh: float

    @field_validator("price_per_kwh")
    @classmethod
    def price_per_kwh_must_be_valid(cls, v: float) -> float:
        if v < 0:
            raise ValueError("price_per_kwh must be zero or greater")
        return v


class ConnectorOut(BaseModel):
    connector_id: int
    connector_number: int
    charge_point_id: str
    status: ChargerStatus
    current_transaction_id: Optional[int] = None
    reserved_by_user_id: Optional[int] = None
    reserved_at: Optional[datetime] = None
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
    price_per_kwh: float
    max_power_kw: int
    current_transaction_id: Optional[int] = None
    connectors: list[ConnectorOut] = []
    created_at: datetime
    last_status_change: datetime

    class Config:
        from_attributes = True


class ChargingInvoice(BaseModel):
    invoice_id: str
    issued_at: datetime
    currency: str
    charger_id: int
    charger_name: str
    connector_id: int
    connector_number: int
    charge_point_id: str
    total_energy_kwh: float
    price_per_kwh: float
    total_amount: float


class ChargerControlResponse(BaseModel):
    charger: ChargerOut
    message: str
    total_energy_kwh: Optional[float] = None
    price_per_kwh: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    invoice: Optional[ChargingInvoice] = None


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
    price_per_kwh: Optional[float] = None
    running_amount: Optional[float] = None
    currency: Optional[str] = None
    temperature_c: float
    soc_percent: float
    timestamp: datetime