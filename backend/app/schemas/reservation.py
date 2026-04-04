from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReservationOut(BaseModel):
    charger_id: int
    charger_name: str
    charger_type: str
    connector_id: int
    connector_number: int
    charge_point_id: str
    status: str
    reserved_at: Optional[datetime] = None
    reserved_by_user_id: Optional[int] = None
    reserved_by_user_name: Optional[str] = None
    reserved_by_email: Optional[str] = None
    reserved_by_phone_number: Optional[str] = None
