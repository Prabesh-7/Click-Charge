from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SlotCreate(BaseModel):
    connector_id: int
    start_time: datetime
    end_time: datetime


class SlotUpdate(BaseModel):
    start_time: datetime
    end_time: datetime


class SlotOut(BaseModel):
    slot_id: int
    connector_id: int
    connector_number: int
    charger_id: int
    charger_name: str
    charger_type: str
    start_time: datetime
    end_time: datetime
    status: str
    reserved_by_user_id: Optional[int] = None
    reserved_by_user_name: Optional[str] = None
    reserved_by_email: Optional[str] = None
    reserved_at: Optional[datetime] = None
    created_by_manager_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
