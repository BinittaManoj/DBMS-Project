from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Customer
from ..schemas import CustomerCreate, CustomerOut

router = APIRouter()


@router.get('/', response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.last_name, Customer.first_name).all()


@router.get('/{customer_id}', response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    return customer


@router.post('/', response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(**payload.model_dump())
    customer.created_at = datetime.utcnow()
    db.add(customer)
    db.commit(); db.refresh(customer)
    return customer


@router.put('/{customer_id}', response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    for key, value in payload.model_dump().items():
        setattr(customer, key, value)
    db.commit(); db.refresh(customer)
    return customer


@router.delete('/{customer_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
    db.delete(customer)
    db.commit()
