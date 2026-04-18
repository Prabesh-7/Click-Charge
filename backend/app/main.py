from fastapi import FastAPI
from app.database import test_db_connection
from app.models.user import create_tables as create_user_tables
from app.models.stations import create_tables as create_station_tables
from app.models.chargers import create_tables as create_charger_tables
from app.models.reservation import create_tables as create_reservation_tables
from app.models.wallet import create_tables as create_wallet_tables
from app.models.charging_session import create_tables as create_charging_session_tables
from app.models.station_review import create_tables as create_station_review_tables
from app.models.reservation_payment import create_tables as create_reservation_payment_tables

from app.routes import auth
from app.routes import admin_routes
from app.routes import manager_routes
from app.routes import staff_routes
from app.routes import user_routes
from app.routes import ocpp_routes
from app.routes import wallet_routes

import os

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title = "Click&Charge")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)



origins = [
    "http://localhost:5173",  # React default port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin_routes.router)
app.include_router(manager_routes.router)
app.include_router(staff_routes.router)
app.include_router(user_routes.router)
app.include_router(ocpp_routes.router)
app.include_router(wallet_routes.router)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


async def _run_startup_step(label: str, step, required: bool = False):
    try:
        await step()
    except Exception as exc:
        if required:
            raise
        print(f"Skipping {label} during startup: {exc}")


@app.get("/health-check")
def read_root():
    return {"message": "Backend is running properly"}

@app.on_event("startup")
async def on_startup():
    await test_db_connection()
    await _run_startup_step("user tables", create_user_tables, required=True)
    await _run_startup_step("station tables", create_station_tables)
    await _run_startup_step("charger tables", create_charger_tables)
    await _run_startup_step("reservation tables", create_reservation_tables)
    await _run_startup_step("wallet tables", create_wallet_tables)
    await _run_startup_step("charging session tables", create_charging_session_tables)
    await _run_startup_step("station review tables", create_station_review_tables)
    await _run_startup_step("reservation payment tables", create_reservation_payment_tables)
    
    