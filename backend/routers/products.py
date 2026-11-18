from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Product
from ..schemas import ProductCreate, ProductOut

router = APIRouter()


@router.get('/', response_model=list[ProductOut])
def list_products(requires_prescription: bool | None = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(
        Product.is_active.is_(True),
    )
    if requires_prescription is not None:
        query = query.filter(Product.requires_prescription.is_(requires_prescription))
    return query.order_by(Product.product_name).all()


@router.get('/{product_id}', response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.product_id == product_id,
        Product.is_active.is_(True),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    return product


@router.post('/', response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    values = payload.model_dump()
    if values.get('medicine_code') is not None:
        values['medicine_code'] = values['medicine_code'].strip() or None
    if not values.get('medicine_code'):
        next_code = db.execute(text("SELECT nextval('medicine_code_seq')")).scalar_one()
        values['medicine_code'] = f'MED-{next_code:06d}'
    product = Product(**values)
    product.created_at = datetime.utcnow()
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Medicine code or product name and brand already exists',
        ) from exc
    db.refresh(product)
    return product


@router.put('/{product_id}', response_model=ProductOut)
def update_product(product_id: int, payload: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.product_id == product_id,
        Product.is_active.is_(True),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    values = payload.model_dump(exclude_unset=True)
    if values.get('medicine_code') is not None:
        values['medicine_code'] = values['medicine_code'].strip() or None
    if not values.get('medicine_code'):
        values.pop('medicine_code', None)
    for key, value in values.items():
        setattr(product, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Medicine code or product name and brand already exists',
        ) from exc
    db.refresh(product)
    return product


@router.delete('/{product_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.product_id == product_id,
        Product.is_active.is_(True),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    product.is_active = False
    db.commit()
