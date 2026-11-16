from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db

router = APIRouter()


@router.get('/branch-sales')
def branch_sales(db: Session = Depends(get_db)):
    return crud.fetch_branch_sales_summary(db)


@router.get('/inventory-status')
def inventory_status(db: Session = Depends(get_db)):
    return crud.fetch_inventory_status(db)
