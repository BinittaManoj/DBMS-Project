from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..models import Inventory
from ..schemas import InventoryCreate, InventoryOut, RestockRequest

router = APIRouter()


@router.get('/', response_model=list[InventoryOut])
def list_inventory(db: Session = Depends(get_db)):
    return crud.fetch_inventory(db)


@router.get('/status', response_model=list[dict])
def inventory_status(db: Session = Depends(get_db)):
    return crud.fetch_inventory_status(db)


@router.post('/restock', status_code=status.HTTP_200_OK)
def restock(payload: RestockRequest, db: Session = Depends(get_db)):
    try:
        return crud.restock_inventory(db, payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/', response_model=InventoryOut, status_code=status.HTTP_201_CREATED)
def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)):
    item = Inventory(**payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item
