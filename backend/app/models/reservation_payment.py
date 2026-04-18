from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Float, Enum, text
from sqlalchemy.sql import func
from app.database import Base, engine
import enum


class ReservationPaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class ReservationPaymentRequest(Base):
    __tablename__ = "reservation_payment_requests"

    payment_request_id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.reservation_id"), nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=False, index=True)
    manager_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(16), nullable=False, server_default=text("'NPR'"))
    note = Column(String(255), nullable=True)
    status = Column(
        Enum(ReservationPaymentStatus, name="reservation_payment_status"),
        nullable=False,
        default=ReservationPaymentStatus.PENDING,
    )
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: ReservationPaymentRequest.__table__.create(sync_conn, checkfirst=True)
        )

        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS reservation_payment_requests (
                    payment_request_id SERIAL PRIMARY KEY,
                    reservation_id INTEGER NOT NULL REFERENCES reservations(reservation_id),
                    station_id INTEGER NOT NULL REFERENCES stations(station_id),
                    manager_user_id INTEGER NOT NULL REFERENCES users(user_id),
                    user_id INTEGER NOT NULL REFERENCES users(user_id),
                    amount DOUBLE PRECISION NOT NULL,
                    currency VARCHAR(16) NOT NULL DEFAULT 'NPR',
                    note VARCHAR(255) NULL,
                    status reservation_payment_status NOT NULL DEFAULT 'PENDING',
                    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    paid_at TIMESTAMPTZ NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )

        await conn.execute(
            text(
                "ALTER TABLE reservation_payment_requests ADD COLUMN IF NOT EXISTS currency VARCHAR(16) NOT NULL DEFAULT 'NPR'"
            )
        )
        await conn.execute(
            text("ALTER TABLE reservation_payment_requests ADD COLUMN IF NOT EXISTS note VARCHAR(255)")
        )
        await conn.execute(
            text(
                "ALTER TABLE reservation_payment_requests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ"
            )
        )

        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_reservation_payment_requests_reservation_id ON reservation_payment_requests(reservation_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_reservation_payment_requests_station_id ON reservation_payment_requests(station_id)"
            )
        )
        await conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_reservation_payment_requests_user_id ON reservation_payment_requests(user_id)"
            )
        )

    print("Reservation Payment Tables created!")
