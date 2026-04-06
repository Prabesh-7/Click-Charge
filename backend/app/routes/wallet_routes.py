from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.wallet import (
    WalletOut,
    WalletPayRequest,
    WalletPayResponse,
    WalletTopupConfirmRequest,
    WalletTopupConfirmResponse,
    WalletTopupInitRequest,
    WalletTopupInitResponse,
)
from app.services.wallet_service import (
    confirm_esewa_topup,
    create_esewa_topup_request,
    get_wallet_by_user,
    pay_from_wallet,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/user/wallet", tags=["User Wallet"])


@router.get("", response_model=WalletOut)
async def get_wallet(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wallet = await get_wallet_by_user(current_user, db)
    return {
        "wallet_id": wallet.wallet_id,
        "user_id": wallet.user_id,
        "balance": float(wallet.balance),
        "updated_at": wallet.updated_at,
    }


@router.post("/esewa/initiate", response_model=WalletTopupInitResponse)
async def initiate_esewa_topup(
    payload: WalletTopupInitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_esewa_topup_request(payload, current_user, db)


@router.post("/esewa/confirm", response_model=WalletTopupConfirmResponse)
async def confirm_esewa_payment(
    payload: WalletTopupConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await confirm_esewa_topup(payload, current_user, db)


@router.post("/pay", response_model=WalletPayResponse)
async def wallet_pay(
    payload: WalletPayRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await pay_from_wallet(payload, current_user, db)
