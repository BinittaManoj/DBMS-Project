import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer
from passlib.context import CryptContext
import jwt
from sqlalchemy.orm import Session

from .database import get_db
from .models import AppUser

SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'medmart-dev-secret-key')
ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', '60'))
COOKIE_NAME = 'access_token'

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
security = HTTPBearer(auto_error=False)

DEMO_USERS = {
    'gm@medmart.in': {
        'user_id': 1,
        'full_name': 'General Manager',
        'email': 'gm@medmart.in',
        'password_hash': '$2b$12$fuYppuEBbUg..NqjcuIo6.c0lYGKnjwtL31p9oy.iAK0Ow1l/B1pK',
        'role': 'GENERAL_MANAGER',
        'branch_id': None,
        'is_active': True,
    },
    'branch1@medmart.in': {
        'user_id': 2,
        'full_name': 'Branch 1 Manager',
        'email': 'branch1@medmart.in',
        'password_hash': '$2b$12$NbrqyrjvXWD/RngmAWGeYOUUjAoSsBgZjeL0iYvHOzrfTDZyCL9AC',
        'role': 'BRANCH_MANAGER',
        'branch_id': 1,
        'is_active': True,
    },
    'branch2@medmart.in': {
        'user_id': 3,
        'full_name': 'Branch 2 Manager',
        'email': 'branch2@medmart.in',
        'password_hash': '$2b$12$Fvk4AIgUPANkg6DAlXaf5.ULKa9d0meHJR74s936/WswGRW6d1btO',
        'role': 'BRANCH_MANAGER',
        'branch_id': 2,
        'is_active': True,
    },
    'branch3@medmart.in': {
        'user_id': 4,
        'full_name': 'Branch 3 Manager',
        'email': 'branch3@medmart.in',
        'password_hash': '$2b$12$Vdg3KX9gwbYnvedGaQj1KOipop0WI/2CLHnjYmWjzEbUo0hY1DqF2',
        'role': 'BRANCH_MANAGER',
        'branch_id': 3,
        'is_active': True,
    },
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _serialize_user(user: Any) -> dict[str, Any]:
    if hasattr(user, 'user_id'):
        return {
            'user_id': user.user_id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'branch_id': user.branch_id,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if getattr(user, 'created_at', None) else None,
        }
    return {
        'user_id': user['user_id'],
        'full_name': user['full_name'],
        'email': user['email'],
        'role': user['role'],
        'branch_id': user['branch_id'],
        'is_active': user['is_active'],
        'created_at': None,
    }


def create_access_token(subject: dict[str, Any]) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = dict(subject)
    payload['exp'] = expires
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid or expired token') from exc


def _db_user_lookup(db: Session, email: str) -> Optional[AppUser]:
    try:
        return db.query(AppUser).filter(AppUser.email == email).first()
    except Exception:
        return None


def authenticate_user(email: str, password: str, db: Optional[Session] = None) -> Optional[dict[str, Any]]:
    email = (email or '').strip().lower()
    if not email or not password:
        return None

    demo_user = DEMO_USERS.get(email)
    if demo_user and verify_password(password, demo_user['password_hash']):
        if not demo_user.get('is_active', True):
            return None
        return _serialize_user(demo_user)

    if db is not None:
        user = _db_user_lookup(db, email)
        if user and user.is_active and verify_password(password, user.password_hash):
            return _serialize_user(user)

    return None


def _get_token_from_request(request: Request) -> Optional[str]:
    token = request.cookies.get(COOKIE_NAME)
    if token:
        return token
    auth_header = request.headers.get('authorization', '')
    if auth_header.lower().startswith('bearer '):
        return auth_header.split(' ', 1)[1].strip()
    return None


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> dict[str, Any]:
    token = _get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Authentication required')

    payload = decode_access_token(token)
    email = payload.get('email')
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')

    demo_user = next((u for u in DEMO_USERS.values() if u['email'] == email), None)
    if demo_user is not None and demo_user.get('is_active', True):
        return _serialize_user(demo_user)

    db_user = _db_user_lookup(db, email)
    if db_user is not None and db_user.is_active:
        return _serialize_user(db_user)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User is inactive or not found')


async def require_gm(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if current_user.get('role') != 'GENERAL_MANAGER':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='General manager access required')
    return current_user


async def require_branch_manager(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if current_user.get('role') != 'BRANCH_MANAGER':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Branch manager access required')
    return current_user


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite='lax',
        secure=False,
        path='/',
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def clear_auth_cookie(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path='/')


async def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> Optional[dict[str, Any]]:
    token = _get_token_from_request(request)
    if not token:
        return None
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return None
