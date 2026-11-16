from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Product
from ..schemas import ProductCreate, ProductOut

router = APIRouter()


@router.get('/', response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.product_name).all()


@router.get('/{product_id}', response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    return product


@router.post('/', response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    product = Product(**payload.model_dump())
    product.created_at = datetime.utcnow()
    db.add(product)
    db.commit(); db.refresh(product)
    return product


@router.put('/{product_id}', response_model=ProductOut)
def update_product(product_id: int, payload: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    for key, value in payload.model_dump().items():
        setattr(product, key, value)
    db.commit(); db.refresh(product)
    return product


@router.delete('/{product_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail='Product not found')
    product.is_active = False
    db.commit()
