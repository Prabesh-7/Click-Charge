from passlib.context import CryptContext
from passlib.exc import UnknownHashError


pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
	return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
	if not hashed_password:
		return False

	try:
		return pwd_context.verify(plain_password, hashed_password)
	except (UnknownHashError, ValueError):
		return False

