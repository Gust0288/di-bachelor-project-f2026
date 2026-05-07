from __future__ import annotations

from datetime import datetime, timezone, timedelta

import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def create_token(payload: dict, expires_in_minutes: int = 60) -> str:
    settings = get_settings()
    data = {
        **payload,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes),
    }
    return jwt.encode(data, settings.jwt_secret, algorithm="HS256")


def verify_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token udløbet")
    except jwt.InvalidTokenError:
        raise ValueError("Ugyldigt token")
