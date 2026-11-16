from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Supplier
from ..schemas import SupplierCreate, SupplierOut

router = APIRouter()


@router.get('/', response_model=list[SupplierOut])
def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.supplier_name).all()


@router.get('/{supplier_id}', response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail='Supplier not found')
    return supplier


@router.post('/', response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    supplier = Supplier(**payload.model_dump())
    supplier.created_at = datetime.utcnow()
    db.add(supplier)
    db.commit(); db.refresh(supplier)
    return supplier


@router.put('/{supplier_id}', response_model=SupplierOut)
def update_supplier(supplier_id: int, payload: SupplierCreate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail='Supplier not found')
    for key, value in payload.model_dump().items():
        setattr(supplier, key, value)
    db.commit(); db.refresh(supplier)
    return supplier


@router.delete('/{supplier_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.supplier_id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail='Supplier not found')
    supplier.is_active = False
    db.commit()
