from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.userValidation import UserCreate, UserOut, UserLogin, Token, ForgotPasswordRequest, VerifyResetOtpRequest, ResetPasswordRequest, MessageResponse, VerifyResetOtpResponse
from app.services.user_service import register_user, login_user, request_password_reset, verify_password_reset_otp, reset_password
from app.database import get_db

router = APIRouter()


@router.post("/register", response_model=UserOut)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(user, db)

@router.post("/login", response_model=Token)
async def login(
    user: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    return await login_user(user, db)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    return await request_password_reset(payload, db)


@router.post("/verify-reset-otp", response_model=VerifyResetOtpResponse)
async def verify_reset_otp(
    payload: VerifyResetOtpRequest,
    db: AsyncSession = Depends(get_db),
):
    return await verify_password_reset_otp(payload, db)


@router.post("/reset-password", response_model=MessageResponse)
async def confirm_reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    return await reset_password(payload, db)


