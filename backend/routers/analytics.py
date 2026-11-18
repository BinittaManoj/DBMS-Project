from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud
from ..auth import get_current_user
from ..database import get_db

router = APIRouter()


@router.get('/dashboard')
def dashboard(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    branch_id = user.get('branch_id') if user.get('role') == 'BRANCH_MANAGER' else None
    return crud.fetch_dashboard_stats(db, branch_id)


@router.get('/charts')
def dashboard_charts(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    branch_id = user.get('branch_id') if user.get('role') == 'BRANCH_MANAGER' else None
    branch_revenue = crud.fetch_branch_sales_summary(db)
    if branch_id is not None:
        branch_revenue = [row for row in branch_revenue if row['branch_id'] == branch_id]
    return {
        'sales_trend': crud.fetch_sales_trend(db, branch_id),
        'branch_revenue': branch_revenue,
    }


@router.get('/medicine/{product_id}')
def medicine_analytics(
    product_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    branch_id = user.get('branch_id') if user.get('role') == 'BRANCH_MANAGER' else None
    result = crud.fetch_medicine_analytics(db, product_id, branch_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Active medicine not found')
    return result
