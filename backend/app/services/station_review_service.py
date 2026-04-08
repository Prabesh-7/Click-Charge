from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi import HTTPException

from app.models.stations import Station
from app.models.station_review import StationReview
from app.models.user import User
from app.schemas.station_review import StationReviewCreate, StationReviewOut, StationReviewSummaryOut


async def _ensure_station_exists(station_id: int, db: AsyncSession) -> None:
    station_result = await db.execute(
        select(Station.station_id).where(Station.station_id == station_id)
    )
    station = station_result.first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")


async def upsert_station_review(
    station_id: int,
    data: StationReviewCreate,
    current_user: User,
    db: AsyncSession,
) -> StationReviewOut:
    await _ensure_station_exists(station_id, db)

    review_result = await db.execute(
        select(StationReview).where(
            StationReview.station_id == station_id,
            StationReview.user_id == current_user.user_id,
        )
    )
    review = review_result.scalar_one_or_none()

    cleaned_text = (data.review_text or "").strip() or None

    if review is None:
        review = StationReview(
            station_id=station_id,
            user_id=current_user.user_id,
            rating=data.rating,
            review_text=cleaned_text,
        )
        db.add(review)
    else:
        review.rating = data.rating
        review.review_text = cleaned_text

    await db.commit()
    await db.refresh(review)

    return StationReviewOut(
        review_id=review.review_id,
        station_id=review.station_id,
        user_id=review.user_id,
        user_name=current_user.user_name,
        rating=review.rating,
        review_text=review.review_text,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


async def get_station_reviews(station_id: int, db: AsyncSession) -> list[StationReviewOut]:
    await _ensure_station_exists(station_id, db)

    review_result = await db.execute(
        select(StationReview, User.user_name)
        .join(User, User.user_id == StationReview.user_id)
        .where(StationReview.station_id == station_id)
        .order_by(StationReview.updated_at.desc())
    )

    rows = review_result.all()
    return [
        StationReviewOut(
            review_id=review.review_id,
            station_id=review.station_id,
            user_id=review.user_id,
            user_name=user_name,
            rating=review.rating,
            review_text=review.review_text,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review, user_name in rows
    ]


async def get_station_review_summary(
    station_id: int,
    current_user: User,
    db: AsyncSession,
) -> StationReviewSummaryOut:
    await _ensure_station_exists(station_id, db)

    aggregate_result = await db.execute(
        select(
            func.coalesce(func.avg(StationReview.rating), 0).label("average_rating"),
            func.count(StationReview.review_id).label("review_count"),
        ).where(StationReview.station_id == station_id)
    )
    aggregate = aggregate_result.one()

    my_review_result = await db.execute(
        select(StationReview.rating, StationReview.review_text).where(
            StationReview.station_id == station_id,
            StationReview.user_id == current_user.user_id,
        )
    )
    my_review = my_review_result.one_or_none()

    return StationReviewSummaryOut(
        station_id=station_id,
        average_rating=round(float(aggregate.average_rating or 0), 2),
        review_count=int(aggregate.review_count or 0),
        my_rating=my_review.rating if my_review else None,
        my_review_text=my_review.review_text if my_review else None,
    )


async def get_station_review_aggregates(
    station_ids: list[int],
    current_user_id: int | None,
    db: AsyncSession,
) -> tuple[dict[int, tuple[float, int]], dict[int, int]]:
    if not station_ids:
        return {}, {}

    aggregate_result = await db.execute(
        select(
            StationReview.station_id,
            func.avg(StationReview.rating).label("average_rating"),
            func.count(StationReview.review_id).label("review_count"),
        )
        .where(StationReview.station_id.in_(station_ids))
        .group_by(StationReview.station_id)
    )

    aggregate_map: dict[int, tuple[float, int]] = {}
    for station_id, average_rating, review_count in aggregate_result.all():
        aggregate_map[int(station_id)] = (
            round(float(average_rating or 0), 2),
            int(review_count or 0),
        )

    my_rating_map: dict[int, int] = {}
    if current_user_id is not None:
        my_ratings_result = await db.execute(
            select(StationReview.station_id, StationReview.rating).where(
                StationReview.station_id.in_(station_ids),
                StationReview.user_id == current_user_id,
            )
        )
        for station_id, rating in my_ratings_result.all():
            my_rating_map[int(station_id)] = int(rating)

    return aggregate_map, my_rating_map
