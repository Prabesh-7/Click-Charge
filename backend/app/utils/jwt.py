from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.schemas.userValidation import TokenData

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
PASSWORD_RESET_SESSION_EXPIRE_MINUTES = 10


def create_access_token(data: TokenData) -> str:

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "user_id": data.user_id,
        "email": data.email,
        "role": data.role,
        "exp": expire
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token


def create_password_reset_session_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=PASSWORD_RESET_SESSION_EXPIRE_MINUTES)
    payload = {
        "email": email,
        "purpose": "password_reset_session",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_password_reset_session_token(token: str) -> str:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    email = payload.get("email")
    purpose = payload.get("purpose")

    if purpose != "password_reset_session" or not email:
        raise JWTError("Invalid reset session token")

    return str(email)
