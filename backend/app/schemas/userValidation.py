from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime



class UserCreate(BaseModel):
    user_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone_number: Optional[str] = None
    vehicle: Optional[str] = None


class UserOut(BaseModel):
    user_id: int
    user_name: str
    email: EmailStr
    role: str
    phone_number: Optional[str] = None
    vehicle: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    email: str
    role: str