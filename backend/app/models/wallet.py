from decimal import Decimal
import enum

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum, text
from sqlalchemy.sql import func

from app.database import Base, engine


class WalletTransactionType(str, enum.Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class WalletTransactionSource(str, enum.Enum):
    ESEWA_TOPUP = "ESEWA_TOPUP"
    SLOT_RESERVATION = "SLOT_RESERVATION"
    MANUAL = "MANUAL"


class EsewaTopupStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Wallet(Base):
    __tablename__ = "wallets"

    wallet_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True, index=True)
    balance = Column(Numeric(12, 2), nullable=False, server_default=text("0"), default=Decimal("0.00"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("wallets.wallet_id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    transaction_type = Column(Enum(WalletTransactionType, name="wallet_transaction_type"), nullable=False)
    source = Column(Enum(WalletTransactionSource, name="wallet_transaction_source"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    balance_after = Column(Numeric(12, 2), nullable=False)
    reference = Column(String(120), nullable=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EsewaTopupRequest(Base):
    __tablename__ = "esewa_topup_requests"

    topup_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    transaction_uuid = Column(String(120), nullable=False, unique=True, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(EsewaTopupStatus, name="esewa_topup_status"), nullable=False, default=EsewaTopupStatus.PENDING)
    esewa_ref_id = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: Base.metadata.create_all(
                bind=sync_conn,
                tables=[Wallet.__table__, WalletTransaction.__table__, EsewaTopupRequest.__table__],
            )
        )
    print("Wallet Tables created!")
