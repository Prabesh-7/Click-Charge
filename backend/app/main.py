from fastapi import FastAPI

app = FastAPI()

@app.get("/aa")
def read_root():
    return {"Hello": "World"}