import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.wallet import (
    EsewaTopupRequest,
    EsewaTopupStatus,
    Wallet,
    WalletTransaction,
    WalletTransactionSource,
    WalletTransactionType,
)
from app.schemas.wallet import (
    WalletTopupConfirmRequest,
    WalletTopupInitRequest,
    WalletTopupInitResponse,
    WalletTopupFormFields,
    WalletPayRequest,
)

ESEWA_PRODUCT_CODE = os.getenv("ESEWA_PRODUCT_CODE", "EPAYTEST")
ESEWA_SECRET = os.getenv("ESEWA_SECRET", "8gBm/:&EnhH.1/q")
ESEWA_FORM_URL = os.getenv("ESEWA_FORM_URL", "https://rc-epay.esewa.com.np/api/epay/main/v2/form")
ESEWA_STATUS_URL = os.getenv("ESEWA_STATUS_URL", "https://rc.esewa.com.np/api/epay/transaction/status/")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
SLOT_RESERVATION_FEE = Decimal("50")


def _to_money(value: Decimal | float | int | str) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _money_str(value: Decimal) -> str:
    return format(_to_money(value), "f")


def _generate_signature(total_amount: Decimal, transaction_uuid: str, product_code: str) -> str:
    hash_string = (
        f"total_amount={_money_str(total_amount)},"
        f"transaction_uuid={transaction_uuid},"
        f"product_code={product_code}"
    )
    digest = hmac.new(ESEWA_SECRET.encode("utf-8"), hash_string.encode("utf-8"), hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")


def _decode_esewa_data(encoded_data: str) -> dict:
    try:
        # eSewa may omit base64 padding.
        padded = encoded_data + "=" * ((4 - len(encoded_data) % 4) % 4)
        decoded = base64.b64decode(padded).decode("utf-8")
        payload = json.loads(decoded)
        if not isinstance(payload, dict):
            raise ValueError("Invalid payload type")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid eSewa callback data") from exc


async def _get_or_create_wallet(db: AsyncSession, user_id: int, lock: bool = False) -> Wallet:
    query = select(Wallet).where(Wallet.user_id == user_id)
    if lock:
        query = query.with_for_update()

    result = await db.execute(query)
    wallet = result.scalar_one_or_none()
    if wallet:
        return wallet

    wallet = Wallet(user_id=user_id, balance=_to_money(0))
    db.add(wallet)
    await db.flush()
    if lock:
        await db.refresh(wallet)
    return wallet


async def get_wallet_by_user(current_user: User, db: AsyncSession) -> Wallet:
    return await _get_or_create_wallet(db, current_user.user_id)


async def create_esewa_topup_request(
    payload: WalletTopupInitRequest,
    current_user: User,
    db: AsyncSession,
) -> WalletTopupInitResponse:
    amount = _to_money(payload.amount)

    transaction_uuid = str(uuid4())
    signature = _generate_signature(amount, transaction_uuid, ESEWA_PRODUCT_CODE)

    topup = EsewaTopupRequest(
        user_id=current_user.user_id,
        transaction_uuid=transaction_uuid,
        amount=amount,
        status=EsewaTopupStatus.PENDING,
    )
    db.add(topup)
    await db.commit()

    form_fields = WalletTopupFormFields(
        amount=_money_str(amount),
        tax_amount="0",
        total_amount=_money_str(amount),
        transaction_uuid=transaction_uuid,
        product_service_charge="0",
        product_delivery_charge="0",
        product_code=ESEWA_PRODUCT_CODE,
        success_url=f"{FRONTEND_BASE_URL}/user/wallet/add-funds/esewa",
        failure_url=f"{FRONTEND_BASE_URL}/user/wallet/add-funds/esewa",
        signed_field_names="total_amount,transaction_uuid,product_code",
        signature=signature,
    )

    return WalletTopupInitResponse(
        action_url=ESEWA_FORM_URL,
        fields=form_fields,
    )


async def _fetch_esewa_status(
    transaction_uuid: str,
    product_code: str,
    total_amount: Decimal,
) -> tuple[str | None, str | None]:
    params = {
        "product_code": product_code,
        "total_amount": _money_str(total_amount),
        "transaction_uuid": transaction_uuid,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(ESEWA_STATUS_URL, params=params)
        if response.status_code != 200:
            return None, None
        data = response.json()
        status = str(data.get("status", "")).strip().upper() or None
        ref_id = str(data.get("ref_id", "")).strip() or None
        return status, ref_id
    except Exception:
        return None, None


async def confirm_esewa_topup(
    payload: WalletTopupConfirmRequest,
    current_user: User,
    db: AsyncSession,
) -> dict:
    callback_data = _decode_esewa_data(payload.data)

    transaction_uuid = str(callback_data.get("transaction_uuid", "")).strip()
    status = str(callback_data.get("status", "")).strip().upper()
    product_code = str(callback_data.get("product_code", "")).strip()
    raw_amount = callback_data.get("total_amount", 0)
    amount = _to_money(raw_amount)
    ref_id = str(callback_data.get("transaction_code", "")).strip() or None

    if not transaction_uuid:
        raise HTTPException(status_code=400, detail="Missing transaction_uuid in callback")

    topup_result = await db.execute(
        select(EsewaTopupRequest)
        .where(
            EsewaTopupRequest.transaction_uuid == transaction_uuid,
            EsewaTopupRequest.user_id == current_user.user_id,
        )
        .with_for_update()
    )
    topup = topup_result.scalar_one_or_none()

    if not topup:
        raise HTTPException(status_code=404, detail="Top-up request not found")

    if topup.status == EsewaTopupStatus.COMPLETED:
        wallet = await _get_or_create_wallet(db, current_user.user_id)
        return {
            "message": "Top-up already confirmed",
            "balance": float(_to_money(wallet.balance)),
            "transaction_uuid": transaction_uuid,
        }

    if topup.status == EsewaTopupStatus.FAILED:
        raise HTTPException(status_code=400, detail="Top-up already marked as failed")

    if amount != _to_money(topup.amount):
        topup.status = EsewaTopupStatus.FAILED
        await db.commit()
        raise HTTPException(status_code=400, detail="Amount mismatch in callback")

    if product_code and product_code != ESEWA_PRODUCT_CODE:
        topup.status = EsewaTopupStatus.FAILED
        await db.commit()
        raise HTTPException(status_code=400, detail="Invalid product code")

    status_check, status_ref_id = await _fetch_esewa_status(
        transaction_uuid,
        product_code or ESEWA_PRODUCT_CODE,
        amount,
    )

    is_complete = status == "COMPLETE" and status_check == "COMPLETE"

    if not is_complete:
        # Keep request pending during temporary gateway issues or in-flight states.
        if status_check in {None, "PENDING", "AMBIGUOUS"}:
            raise HTTPException(
                status_code=503,
                detail=(
                    "eSewa is currently unavailable or payment is still pending. "
                    "Please retry confirmation in 1-2 minutes."
                ),
            )

        topup.status = EsewaTopupStatus.FAILED
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"eSewa payment not completed (status: {status_check or status or 'UNKNOWN'})",
        )

    wallet = await _get_or_create_wallet(db, current_user.user_id, lock=True)
    wallet.balance = _to_money(wallet.balance) + amount

    transaction = WalletTransaction(
        wallet_id=wallet.wallet_id,
        user_id=current_user.user_id,
        transaction_type=WalletTransactionType.CREDIT,
        source=WalletTransactionSource.ESEWA_TOPUP,
        amount=amount,
        balance_after=wallet.balance,
        reference=ref_id or transaction_uuid,
        description="Wallet top-up from eSewa",
    )
    db.add(transaction)

    topup.status = EsewaTopupStatus.COMPLETED
    topup.esewa_ref_id = ref_id or status_ref_id
    topup.completed_at = datetime.now(tz=timezone.utc)

    await db.commit()

    return {
        "message": "Wallet top-up successful",
        "balance": float(_to_money(wallet.balance)),
        "transaction_uuid": transaction_uuid,
    }


async def debit_wallet(
    current_user: User,
    db: AsyncSession,
    amount: Decimal,
    source: WalletTransactionSource,
    description: str,
    reference: str | None = None,
) -> Decimal:
    normalized_amount = _to_money(amount)
    if normalized_amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    wallet = await _get_or_create_wallet(db, current_user.user_id, lock=True)
    current_balance = _to_money(wallet.balance)

    if current_balance < normalized_amount:
        shortfall = normalized_amount - current_balance
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient wallet balance. Required {normalized_amount}, "
                f"available {current_balance}, short by {shortfall}."
            ),
        )

    wallet.balance = current_balance - normalized_amount

    transaction = WalletTransaction(
        wallet_id=wallet.wallet_id,
        user_id=current_user.user_id,
        transaction_type=WalletTransactionType.DEBIT,
        source=source,
        amount=normalized_amount,
        balance_after=wallet.balance,
        reference=reference,
        description=description,
    )
    db.add(transaction)

    return _to_money(wallet.balance)


async def _credit_wallet_by_user_id(
    db: AsyncSession,
    user_id: int,
    amount: Decimal,
    source: WalletTransactionSource,
    description: str,
    reference: str | None = None,
) -> Decimal:
    normalized_amount = _to_money(amount)
    if normalized_amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    wallet = await _get_or_create_wallet(db, user_id, lock=True)
    wallet.balance = _to_money(wallet.balance) + normalized_amount

    transaction = WalletTransaction(
        wallet_id=wallet.wallet_id,
        user_id=user_id,
        transaction_type=WalletTransactionType.CREDIT,
        source=source,
        amount=normalized_amount,
        balance_after=wallet.balance,
        reference=reference,
        description=description,
    )
    db.add(transaction)

    return _to_money(wallet.balance)


async def pay_from_wallet(
    payload: WalletPayRequest,
    current_user: User,
    db: AsyncSession,
) -> dict:
    new_balance = await debit_wallet(
        current_user=current_user,
        db=db,
        amount=_to_money(payload.amount),
        source=WalletTransactionSource.MANUAL,
        description=payload.description or "Wallet payment",
        reference=payload.reference,
    )
    await db.commit()

    return {
        "message": "Payment completed from wallet",
        "balance": float(new_balance),
        "debited_amount": float(_to_money(payload.amount)),
    }


async def debit_wallet_for_slot_reservation(
    current_user: User,
    db: AsyncSession,
    slot_id: int,
    manager_user_id: int | None = None,
) -> Decimal:
    if SLOT_RESERVATION_FEE <= Decimal("0"):
        wallet = await _get_or_create_wallet(db, current_user.user_id)
        return _to_money(wallet.balance)

    user_balance = await debit_wallet(
        current_user=current_user,
        db=db,
        amount=SLOT_RESERVATION_FEE,
        source=WalletTransactionSource.SLOT_RESERVATION,
        description=f"Slot reservation payment for slot {slot_id}",
        reference=f"slot-{slot_id}",
    )

    if manager_user_id and manager_user_id != current_user.user_id:
        await _credit_wallet_by_user_id(
            db=db,
            user_id=manager_user_id,
            amount=SLOT_RESERVATION_FEE,
            source=WalletTransactionSource.SLOT_RESERVATION,
            description=f"Reservation income for slot {slot_id}",
            reference=f"slot-{slot_id}",
        )

    return user_balance
