from datetime import datetime
from pydantic import BaseModel


class ChargingSessionOut(BaseModel):
    session_id: int
    station_id: int
    charger_id: int
    charger_name: str
    connector_id: int
    connector_number: int
    start_time: datetime
    end_time: datetime | None = None
    started_by_user_id: int | None = None
    invoice_id: str | None = None
    invoice_issued_at: datetime | None = None
    invoice_currency: str | None = None
    invoice_total_energy_kwh: float | None = None
    invoice_price_per_kwh: float | None = None
    invoice_total_amount: float | None = None
    payment_saved: bool = False
    payment_saved_at: datetime | None = None
    revenue_amount: float | None = None


class ChargingRevenueSummaryOut(BaseModel):
    total_sessions: int
    paid_sessions: int
    unpaid_sessions: int
    total_revenue: float

