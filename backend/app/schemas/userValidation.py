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
    station_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    user_name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    vehicle: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user:UserOut


class TokenData(BaseModel):
    user_id: int
    email: str
    role: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(..., min_length=16)
    new_password: str = Field(..., min_length=8)


class MessageResponse(BaseModel):
    message: str


class VerifyResetOtpResponse(MessageResponse):
    reset_token: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str    
    
    