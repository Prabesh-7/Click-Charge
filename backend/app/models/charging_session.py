from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Float, text
from sqlalchemy.sql import func

from app.database import Base, engine


class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    session_id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.station_id"), nullable=False, index=True)
    charger_id = Column(Integer, ForeignKey("chargers.charger_id"), nullable=False, index=True)
    connector_id = Column(Integer, ForeignKey("connectors.connector_id"), nullable=False, index=True)
    started_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    invoice_id = Column(String(64), nullable=True)
    invoice_issued_at = Column(DateTime(timezone=True), nullable=True)
    invoice_currency = Column(String(16), nullable=True)
    invoice_total_energy_kwh = Column(Float, nullable=True)
    invoice_price_per_kwh = Column(Float, nullable=True)
    invoice_total_amount = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Backward-compatible schema sync for existing databases.
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS charging_sessions (
                    session_id SERIAL PRIMARY KEY,
                    station_id INTEGER NOT NULL REFERENCES stations(station_id),
                    charger_id INTEGER NOT NULL REFERENCES chargers(charger_id),
                    connector_id INTEGER NOT NULL REFERENCES connectors(connector_id),
                    started_by_user_id INTEGER NULL REFERENCES users(user_id),
                    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    end_time TIMESTAMPTZ NULL,
                    invoice_id VARCHAR(64) NULL,
                    invoice_issued_at TIMESTAMPTZ NULL,
                    invoice_currency VARCHAR(16) NULL,
                    invoice_total_energy_kwh DOUBLE PRECISION NULL,
                    invoice_price_per_kwh DOUBLE PRECISION NULL,
                    invoice_total_amount DOUBLE PRECISION NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
        )
        await conn.execute(text("ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(64)"))
        await conn.execute(text("ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ"))
        await conn.execute(text("ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS invoice_currency VARCHAR(16)"))
        await conn.execute(text("ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS invoice_total_energy_kwh DOUBLE PRECISION"))
        await conn.execute(text("ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS invoice_price_per_kwh DOUBLE PRECISION"))
        await conn.execute(text("ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS invoice_total_amount DOUBLE PRECISION"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_charging_sessions_station_id ON charging_sessions(station_id)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_charging_sessions_charger_id ON charging_sessions(charger_id)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_charging_sessions_connector_id ON charging_sessions(connector_id)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_charging_sessions_started_by_user_id ON charging_sessions(started_by_user_id)"))

    print("Charging Session Tables created!")
