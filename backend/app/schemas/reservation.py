from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReservationOut(BaseModel):
    reservation_id: Optional[int] = None
    reservation_type: Optional[str] = None
    status: str
    station_id: Optional[int] = None
    station_name: Optional[str] = None
    charger_id: int
    charger_name: str
    charger_type: str
    connector_id: int
    connector_number: int
    charge_point_id: str
    slot_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    reserved_at: Optional[datetime] = None
    reserved_by_user_id: Optional[int] = None
    reserved_by_user_name: Optional[str] = None
    reserved_by_email: Optional[str] = None
    reserved_by_phone_number: Optional[str] = None
    pending_payment_amount: Optional[float] = None
    pending_payment_count: Optional[int] = None
