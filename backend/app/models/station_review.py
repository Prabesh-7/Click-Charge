from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, text
from sqlalchemy.sql import func

from app.database import Base, engine


class StationReview(Base):
    __tablename__ = "station_reviews"
    __table_args__ = (
        UniqueConstraint("station_id", "user_id", name="uq_station_reviews_station_user"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_station_reviews_rating_1_5"),
    )

    review_id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)

    rating = Column(Integer, nullable=False)
    review_text = Column(String(1000), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: StationReview.__table__.create(sync_conn, checkfirst=True))

        # Idempotent compatibility fix if old DBs have this table without review_text.
        await conn.execute(
            text("ALTER TABLE station_reviews ADD COLUMN IF NOT EXISTS review_text VARCHAR(1000)")
        )

    print("Station review tables created!")
