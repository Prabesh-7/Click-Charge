from fastapi import FastAPI
from app.database import test_db_connection
from app.models.user import create_tables

app = FastAPI(title = "Click&Charge")

@app.get("/health-check")
def read_root():
    return {"Backend is running properly"}


@app.on_event("startup")
async def on_startup():
    await test_db_connection()
    await create_tables() 
    
