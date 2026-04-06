from datetime import datetime
from pydantic import BaseModel, Field


class WalletOut(BaseModel):
    wallet_id: int
    user_id: int
    balance: float
    updated_at: datetime | None = None


class WalletTopupInitRequest(BaseModel):
    amount: float = Field(..., gt=0)


class WalletTopupFormFields(BaseModel):
    amount: str
    tax_amount: str
    total_amount: str
    transaction_uuid: str
    product_service_charge: str
    product_delivery_charge: str
    product_code: str
    success_url: str
    failure_url: str
    signed_field_names: str
    signature: str


class WalletTopupInitResponse(BaseModel):
    action_url: str
    fields: WalletTopupFormFields


class WalletTopupConfirmRequest(BaseModel):
    data: str


class WalletTopupConfirmResponse(BaseModel):
    message: str
    balance: float
    transaction_uuid: str


class WalletPayRequest(BaseModel):
    amount: float = Field(..., gt=0)
    description: str | None = None
    reference: str | None = None


class WalletPayResponse(BaseModel):
    message: str
    balance: float
    debited_amount: float
