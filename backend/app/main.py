from fastapi import FastAPI
from app.database import test_db_connection
from app.models.user import create_tables as create_user_tables
from app.models.stations import create_tables as create_station_tables
from app.models.chargers import create_tables as create_charger_tables

from app.routes import auth
from app.routes import admin_routes
from app.routes import manager_routes
from app.routes import ocpp_routes


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title = "Click&Charge")



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
app.include_router(ocpp_routes.router)


@app.get("/health-check")
def read_root():
    return {"message": "Backend is running properly"}

@app.on_event("startup")
async def on_startup():
    await test_db_connection()
    await create_user_tables()
    await create_station_tables()
    await create_charger_tables()
    
    