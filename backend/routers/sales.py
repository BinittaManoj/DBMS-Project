from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..schemas import ProcessSaleRequest

router = APIRouter()


@router.post('/process', status_code=status.HTTP_200_OK)
def process_sale(payload: ProcessSaleRequest, db: Session = Depends(get_db)):
    try:
        return crud.process_sale(db, payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get('/invoice/{invoice_no}')
def get_invoice(invoice_no: str, db: Session = Depends(get_db)):
    invoice = crud.get_invoice_by_number(db, invoice_no)
    if not invoice:
        raise HTTPException(status_code=404, detail='Invoice not found')
    return invoice
