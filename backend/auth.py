from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from flask import jsonify, request

from config import JWT_EXPIRE_HOURS, JWT_SECRET


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(admin_id: int, username: str) -> str:
    payload = {
        "sub": admin_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


def require_admin(f):
    @wraps(f)
    async def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        token = auth[7:]
        try:
            payload = decode_token(token)
            request.admin = payload
        except jwt.PyJWTError:
            return jsonify({"error": "Invalid or expired token"}), 401
        return await f(*args, **kwargs)

    return decorated
