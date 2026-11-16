from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db

router = APIRouter()


@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db)):
    return crud.fetch_dashboard_stats(db)
