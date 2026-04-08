from datetime import datetime

from pydantic import BaseModel, Field


class StationReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=1000)


class StationReviewOut(BaseModel):
    review_id: int
    station_id: int
    user_id: int
    user_name: str | None = None
    rating: int
    review_text: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ManagerStationReviewOut(BaseModel):
    review_id: int
    station_id: int
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    rating: int
    review_text: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StationReviewSummaryOut(BaseModel):
    station_id: int
    average_rating: float
    review_count: int
    my_rating: int | None = None
    my_review_text: str | None = None
