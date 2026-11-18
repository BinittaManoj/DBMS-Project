from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ..auth import authenticate_user, clear_auth_cookie, create_access_token, get_current_user, set_auth_cookie
from ..database import get_db
from ..schemas import AuthResponse, LoginRequest, UserOut

router = APIRouter()


@router.post('/login', response_model=AuthResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(payload.email, payload.password, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid email or password')
    token = create_access_token({'email': user['email'], 'role': user['role'], 'branch_id': user.get('branch_id')})
    set_auth_cookie(response, token)
    return {'access_token': token, 'token_type': 'bearer', 'user': user}


@router.post('/logout')
def logout(response: Response):
    clear_auth_cookie(response)
    return {'success': True, 'message': 'Logged out'}


@router.get('/me', response_model=UserOut)
def me(user: dict = Depends(get_current_user)):
    return user
