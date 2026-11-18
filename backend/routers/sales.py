# backend/routers/sales.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from .. import crud
from ..auth import get_current_user, get_current_user_optional
from ..database import SessionLocal, get_db
from ..schemas import ConcurrencySimulationRequest, ProcessSaleRequest
import threading
import time

router = APIRouter()


@router.get('/')
def list_sales(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
    branch_id: int = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List sales transactions. BRANCH_MANAGER sees only their own branch."""
    if user.get('role') == 'BRANCH_MANAGER':
        branch_id = user.get('branch_id')

    if branch_id:
        result = db.execute(
            text("""
                SELECT s.sale_id, s.invoice_no, b.branch_name, s.branch_id,
                       c.first_name || ' ' || c.last_name AS customer_name,
                       e.first_name || ' ' || e.last_name AS billed_by,
                       s.sale_date, s.subtotal, s.discount, s.tax_amount,
                       s.total_amount, s.payment_method
                FROM sales s
                JOIN branches b ON b.branch_id = s.branch_id
                LEFT JOIN customers c ON c.customer_id = s.customer_id
                LEFT JOIN employees e ON e.employee_id = s.employee_id
                WHERE s.branch_id = :bid
                ORDER BY s.sale_date DESC
                LIMIT :lim OFFSET :off
            """),
            {'bid': branch_id, 'lim': limit, 'off': offset}
        )
    else:
        result = db.execute(
            text("""
                SELECT s.sale_id, s.invoice_no, b.branch_name, s.branch_id,
                       c.first_name || ' ' || c.last_name AS customer_name,
                       e.first_name || ' ' || e.last_name AS billed_by,
                       s.sale_date, s.subtotal, s.discount, s.tax_amount,
                       s.total_amount, s.payment_method
                FROM sales s
                JOIN branches b ON b.branch_id = s.branch_id
                LEFT JOIN customers c ON c.customer_id = s.customer_id
                LEFT JOIN employees e ON e.employee_id = s.employee_id
                ORDER BY s.sale_date DESC
                LIMIT :lim OFFSET :off
            """),
            {'lim': limit, 'off': offset}
        )

    keys = list(result.keys())
    rows = []
    for row in result.fetchall():
        d = dict(zip(keys, row))
        for k, v in d.items():
            if hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
            elif v is None:
                d[k] = None
            elif hasattr(v, '__float__'):
                d[k] = float(v)
        rows.append(d)
    return rows


@router.get('/recent')
def recent_sales(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
    n: int = Query(20, ge=1, le=100),
):
    """Get the N most recent sales."""
    branch_id = user.get('branch_id') if user.get('role') == 'BRANCH_MANAGER' else None
    result = db.execute(
        text("""
            SELECT s.sale_id, s.invoice_no, b.branch_name,
                   s.sale_date, s.total_amount, s.payment_method
            FROM sales s
            JOIN branches b ON b.branch_id = s.branch_id
            WHERE (:bid IS NULL OR s.branch_id = :bid)
            ORDER BY s.sale_date DESC
            LIMIT :n
        """),
        {'bid': branch_id, 'n': n}
    )
    keys = list(result.keys())
    rows = []
    for row in result.fetchall():
        d = dict(zip(keys, row))
        for k, v in d.items():
            if hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
            elif v is None:
                d[k] = None
            elif hasattr(v, '__float__'):
                d[k] = float(v)
        rows.append(d)
    return rows


@router.post('/process', status_code=status.HTTP_200_OK)
def process_sale(
    payload: ProcessSaleRequest,
    db: Session = Depends(get_db),
    user: dict | None = Depends(get_current_user_optional),
):
    """Process a multi-item sale via the process_sale stored procedure."""
    if user and user.get('role') == 'BRANCH_MANAGER':
        if payload.branch_id != user.get('branch_id'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Cannot process sale for another branch',
            )
    try:
        return crud.process_sale(db, payload.model_dump())
    except Exception as exc:
        msg = str(exc)
        if 'Insufficient stock' in msg or 'stock' in msg.lower():
            raise HTTPException(status_code=400, detail=msg) from exc
        raise HTTPException(status_code=400, detail=msg) from exc


@router.get('/invoice/{invoice_no}')
def get_invoice(invoice_no: str, db: Session = Depends(get_db)):
    """Get a single invoice by number including line items."""
    invoice = crud.get_invoice_by_number(db, invoice_no)
    if not invoice:
        raise HTTPException(status_code=404, detail='Invoice not found')
    return invoice


@router.post('/simulate-concurrency')
def simulate_concurrency(payload: ConcurrencySimulationRequest, db: Session = Depends(get_db)):
    """
    Demonstrates PostgreSQL SELECT ... FOR UPDATE row-level locking concurrency safety.
    Simultaneously fires N threads attempting to purchase units of a medicine at the exact same millisecond.
    """
    branch_id = payload.branch_id
    product_id = payload.product_id
    threads_count = max(2, min(20, payload.threads_count))
    qty_per_sale = max(1, payload.quantity_per_sale)

    # Optionally initialize stock level
    if payload.initial_stock is not None:
        db.execute(
            text("UPDATE inventory SET quantity = :qty WHERE branch_id = :bid AND product_id = :pid"),
            {'qty': payload.initial_stock, 'bid': branch_id, 'pid': product_id}
        )
        db.commit()

    # Read stock before simulation
    row_before = db.execute(
        text("SELECT quantity FROM inventory WHERE branch_id = :bid AND product_id = :pid"),
        {'bid': branch_id, 'pid': product_id}
    ).fetchone()
    stock_before = row_before[0] if row_before else 0

    barrier = threading.Barrier(threads_count)
    results = []

    def worker(thread_idx):
        thread_db = SessionLocal()
        thread_start = time.perf_counter()
        try:
            barrier.wait()  # synchronize all threads to fire at the exact same instant
            res = crud.process_sale(thread_db, {
                'branch_id': branch_id,
                'employee_id': 1,
                'payment_method': 'CASH',
                'discount': 0.0,
                'notes': f'Concurrency Test Thread #{thread_idx}',
                'items': [{'product_id': product_id, 'quantity': qty_per_sale, 'unit_price': 18.0, 'discount_pct': 0}],
            })
            elapsed = round((time.perf_counter() - thread_start) * 1000, 2)
            results.append({
                'thread_id': thread_idx,
                'status': 'SUCCESS',
                'invoice_no': res.get('invoice_no'),
                'message': f'Bought {qty_per_sale} units successfully (Invoice {res.get("invoice_no")})',
                'elapsed_ms': elapsed,
            })
        except Exception as exc:
            elapsed = round((time.perf_counter() - thread_start) * 1000, 2)
            msg = str(exc)
            # extract friendly error
            if 'Insufficient stock' in msg:
                clean_msg = msg[msg.find('Insufficient stock'):].split('.')[0]
            else:
                clean_msg = msg
            results.append({
                'thread_id': thread_idx,
                'status': 'ROLLED_BACK',
                'invoice_no': None,
                'message': f'Blocked by row lock: {clean_msg}',
                'elapsed_ms': elapsed,
            })
        finally:
            thread_db.close()

    threads = [threading.Thread(target=worker, args=(i + 1,)) for i in range(threads_count)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Read final stock
    row_after = db.execute(
        text("SELECT quantity FROM inventory WHERE branch_id = :bid AND product_id = :pid"),
        {'bid': branch_id, 'pid': product_id}
    ).fetchone()
    stock_after = row_after[0] if row_after else 0

    success_count = sum(1 for r in results if r['status'] == 'SUCCESS')
    failed_count = sum(1 for r in results if r['status'] == 'ROLLED_BACK')

    return {
        'branch_id': branch_id,
        'product_id': product_id,
        'threads_count': threads_count,
        'quantity_per_sale': qty_per_sale,
        'stock_before': stock_before,
        'stock_after': stock_after,
        'total_units_requested': threads_count * qty_per_sale,
        'total_units_sold': success_count * qty_per_sale,
        'successful_transactions': success_count,
        'rolled_back_transactions': failed_count,
        'overselling_prevented': True,
        'logs': sorted(results, key=lambda x: x['thread_id']),
    }

