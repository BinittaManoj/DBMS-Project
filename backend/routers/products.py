from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Category, Product, Supplier
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

    # Validate or fallback category_id to prevent FK violation
    cat_id = values.get('category_id')
    cat_exists = db.query(Category).filter(Category.category_id == cat_id).first() if cat_id else None
    if not cat_exists:
        first_cat = db.query(Category.category_id).filter(Category.is_active == True).first()
        values['category_id'] = first_cat[0] if first_cat else 1

    # Validate or fallback supplier_id to prevent FK violation
    sup_id = values.get('supplier_id')
    sup_exists = db.query(Supplier).filter(Supplier.supplier_id == sup_id).first() if sup_id else None
    if not sup_exists:
        first_sup = db.query(Supplier.supplier_id).filter(Supplier.is_active == True).first()
        values['supplier_id'] = first_sup[0] if first_sup else 1

    product = Product(**values)
    product.created_at = datetime.utcnow()
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        err_msg = str(exc.orig) if hasattr(exc, 'orig') else str(exc)
        if 'unique constraint' in err_msg.lower() or 'uq_' in err_msg.lower():
            detail = 'Medicine code or product name and brand combination already exists'
        else:
            detail = f'Failed to save product: {err_msg}'
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
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
