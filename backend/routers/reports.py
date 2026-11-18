# backend/routers/reports.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db

router = APIRouter()


@router.get('/branch-sales')
def branch_sales_report(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
    from_date: str = Query(None, description='ISO date e.g. 2026-11-01'),
    to_date: str = Query(None, description='ISO date e.g. 2026-11-30'),
):
    """Branch-wise sales summary with employee count and highest single sale."""
    # Base query from view — parameterise by date if provided
    if from_date and to_date:
        sql = text("""
            SELECT
                b.branch_id, b.branch_name, b.city,
                COUNT(DISTINCT s.sale_id)           AS total_transactions,
                COALESCE(SUM(s.total_amount), 0)    AS total_revenue,
                COALESCE(ROUND(AVG(s.total_amount), 2), 0) AS avg_sale_value,
                COALESCE(MAX(s.total_amount), 0)    AS max_sale_amount,
                (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.branch_id AND e.is_active = TRUE) AS employee_count,
                MAX(s.sale_date)                    AS last_sale_date
            FROM branches b
            LEFT JOIN sales s ON s.branch_id = b.branch_id
                AND s.sale_date BETWEEN :from_date::TIMESTAMPTZ AND :to_date::TIMESTAMPTZ + INTERVAL '1 day'
            WHERE b.is_active = TRUE
            GROUP BY b.branch_id, b.branch_name, b.city
            ORDER BY total_revenue DESC
        """)
        result = db.execute(sql, {'from_date': from_date, 'to_date': to_date})
    else:
        sql = text("""
            SELECT
                b.branch_id, b.branch_name, b.city,
                COUNT(DISTINCT s.sale_id)           AS total_transactions,
                COALESCE(SUM(s.total_amount), 0)    AS total_revenue,
                COALESCE(ROUND(AVG(s.total_amount), 2), 0) AS avg_sale_value,
                COALESCE(MAX(s.total_amount), 0)    AS max_sale_amount,
                (SELECT COUNT(*) FROM employees e WHERE e.branch_id = b.branch_id AND e.is_active = TRUE) AS employee_count,
                MAX(s.sale_date)                    AS last_sale_date
            FROM branches b
            LEFT JOIN sales s ON s.branch_id = b.branch_id
            WHERE b.is_active = TRUE
            GROUP BY b.branch_id, b.branch_name, b.city
            ORDER BY total_revenue DESC
        """)
        result = db.execute(sql)

    keys = list(result.keys())
    rows = [dict(zip(keys, row)) for row in result.fetchall()]
    # Serialise datetimes
    for row in rows:
        for k, v in row.items():
            if hasattr(v, 'isoformat'):
                row[k] = v.isoformat()
            elif v is None:
                row[k] = None
            else:
                row[k] = v if not hasattr(v, '__float__') else float(v)
    return {'from_date': from_date, 'to_date': to_date, 'rows': rows}


@router.get('/employee-sales')
def employee_sales_report(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
    branch_id: int = Query(None, description='Filter by branch ID'),
):
    """Employee sales leaderboard highlighting highest single sale and bill volume."""
    query_str = """
        SELECT
            e.employee_id,
            e.first_name || ' ' || e.last_name AS employee_name,
            e.role,
            e.branch_id,
            b.branch_name,
            COUNT(s.sale_id)                    AS total_transactions,
            COALESCE(SUM(s.total_amount), 0)    AS total_revenue,
            COALESCE(MAX(s.total_amount), 0)    AS highest_single_sale,
            COALESCE(ROUND(AVG(s.total_amount), 2), 0) AS avg_sale_value
        FROM employees e
        JOIN branches b ON b.branch_id = e.branch_id
        LEFT JOIN sales s ON s.employee_id = e.employee_id
        WHERE e.is_active = TRUE
    """
    params = {}
    if branch_id:
        query_str += " AND e.branch_id = :bid"
        params['bid'] = branch_id
    query_str += """
        GROUP BY e.employee_id, e.first_name, e.last_name, e.role, e.branch_id, b.branch_name
        ORDER BY highest_single_sale DESC, total_revenue DESC
    """
    result = db.execute(text(query_str), params)
    keys = list(result.keys())
    rows = [dict(zip(keys, row)) for row in result.fetchall()]
    for row in rows:
        for k, v in row.items():
            if hasattr(v, 'isoformat'):
                row[k] = v.isoformat()
            elif v is None:
                row[k] = None
            elif hasattr(v, '__float__'):
                row[k] = float(v)
    return {'rows': rows}


@router.get('/inventory')
@router.get('/inventory-status')
def inventory_status_report(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
    branch_id: int = Query(None, description='Filter by branch ID'),
    status: str = Query(None, description='Filter by stock status'),
):
    """Inventory status from v_inventory_status view."""
    query_str = "SELECT * FROM v_inventory_status WHERE 1=1"
    params = {}
    if branch_id:
        query_str += " AND branch_id = :bid"
        params['bid'] = branch_id
    if status:
        query_str += " AND stock_status = :st"
        params['st'] = status
    query_str += " ORDER BY stock_status, branch_name, product_name"

    result = db.execute(text(query_str), params)
    keys = list(result.keys())
    rows = [dict(zip(keys, row)) for row in result.fetchall()]
    for row in rows:
        for k, v in row.items():
            if hasattr(v, 'isoformat'):
                row[k] = v.isoformat()
            elif v is None:
                row[k] = None
            elif hasattr(v, '__float__'):
                row[k] = float(v)
    return {'rows': rows}
