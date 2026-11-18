from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category
from ..schemas import CategoryOut

router = APIRouter()


@router.get('/', response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(
        Category.is_active.is_(True),
    ).order_by(Category.category_name).all()
