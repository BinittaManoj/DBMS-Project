from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..models import Sale
from ..schemas import ProcessSaleRequest

router = APIRouter()


@router.get('/')
def list_sales(db: Session = Depends(get_db)):
    sales = db.query(Sale).order_by(Sale.sale_date.desc()).limit(100).all()
    results = []
    for s in sales:
        results.append({
            'sale_id': s.sale_id,
            'invoice_no': s.invoice_no,
            'branch_id': s.branch_id,
            'branch_name': s.branch.branch_name if s.branch else f"Branch #{s.branch_id}",
            'customer_id': s.customer_id,
            'customer_name': f"{s.customer.first_name} {s.customer.last_name}" if s.customer else "Walk-in Customer",
            'employee_id': s.employee_id,
            'employee_name': f"{s.employee.first_name} {s.employee.last_name}" if s.employee else "Staff",
            'sale_date': s.sale_date.isoformat() if s.sale_date else None,
            'subtotal': float(s.subtotal),
            'discount': float(s.discount),
            'tax_amount': float(s.tax_amount),
            'total_amount': float(s.total_amount),
            'payment_method': s.payment_method,
            'notes': s.notes,
            'items_count': len(s.sale_items) if s.sale_items else 0
        })
    return results


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
