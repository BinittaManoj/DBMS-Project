import json
from datetime import datetime
from typing import Any

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .models import Branch, Category, Customer, Employee, Inventory, Product, Sale, Supplier, LowStockAlert


def fetch_dashboard_stats(db: Session, branch_id: int | None = None):
    sales_query = db.query(Sale)
    if branch_id is not None:
        sales_query = sales_query.filter(Sale.branch_id == branch_id)
    total_sales = sales_query.count()
    total_products = db.query(Product).filter(Product.is_active.is_(True)).count()
    total_branches = db.query(Branch).filter(Branch.is_active.is_(True)).count()
    total_customers = db.query(Customer).count()
    revenue_query = db.query(func.coalesce(func.sum(Sale.total_amount), 0))
    alerts_query = db.query(LowStockAlert).filter(LowStockAlert.is_resolved.is_(False))
    if branch_id is not None:
        revenue_query = revenue_query.filter(Sale.branch_id == branch_id)
        alerts_query = alerts_query.filter(LowStockAlert.branch_id == branch_id)
    total_revenue = float(revenue_query.scalar() or 0)
    low_stock_count = alerts_query.count()
    recent_sales = sales_query.order_by(Sale.sale_date.desc()).limit(5).all()
    return {
        'total_sales': total_sales,
        'total_revenue': total_revenue,
        'total_products': total_products,
        'total_branches': total_branches,
        'total_customers': total_customers,
        'low_stock_count': low_stock_count,
        'recent_sales': [
            {
                'invoice_no': s.invoice_no,
                'total_amount': float(s.total_amount),
                'sale_date': s.sale_date.isoformat() if s.sale_date else None,
                'branch_id': s.branch_id,
            }
            for s in recent_sales
        ],
    }


def fetch_medicine_analytics(db: Session, product_id: int, branch_id: int | None = None):
    medicine = db.execute(text(
        """
        SELECT p.product_id, p.medicine_code, p.product_name, p.brand, p.image_url,
               p.unit_price, p.cost_price,
               p.unit_of_measure, p.drug_schedule, p.requires_prescription,
               c.category_name, s.supplier_name,
               COALESCE(sales.units_sold, 0)::INTEGER AS units_sold,
               COALESCE(sales.revenue, 0)::FLOAT AS revenue,
               COALESCE(sales.transactions, 0)::INTEGER AS transactions
        FROM products p
        JOIN categories c ON c.category_id = p.category_id
        JOIN suppliers s ON s.supplier_id = p.supplier_id
        LEFT JOIN (
            SELECT si.product_id, SUM(si.quantity) AS units_sold,
                   SUM(si.subtotal) AS revenue, COUNT(DISTINCT sa.sale_id) AS transactions
            FROM sale_items si
            JOIN sales sa ON sa.sale_id = si.sale_id
            WHERE si.product_id = :product_id
              AND (:branch_id IS NULL OR sa.branch_id = :branch_id)
            GROUP BY si.product_id
        ) sales ON sales.product_id = p.product_id
        WHERE p.product_id = :product_id
          AND p.is_active = TRUE
        """
    ), {'product_id': product_id, 'branch_id': branch_id}).mappings().first()
    if medicine is None:
        return None

    branches = db.execute(text(
        """
        SELECT b.branch_id, b.branch_name,
               COALESCE(i.quantity, 0)::INTEGER AS current_stock,
               COALESCE(sales.units_sold, 0)::INTEGER AS units_sold,
               COALESCE(sales.revenue, 0)::FLOAT AS revenue
        FROM branches b
        LEFT JOIN inventory i
          ON i.branch_id = b.branch_id AND i.product_id = :product_id
        LEFT JOIN (
            SELECT sa.branch_id, SUM(si.quantity) AS units_sold,
                   SUM(si.subtotal) AS revenue
            FROM sale_items si
            JOIN sales sa ON sa.sale_id = si.sale_id
            WHERE si.product_id = :product_id
            GROUP BY sa.branch_id
        ) sales ON sales.branch_id = b.branch_id
        WHERE b.is_active = TRUE
          AND (:branch_id IS NULL OR b.branch_id = :branch_id)
        ORDER BY b.branch_name
        """
    ), {'product_id': product_id, 'branch_id': branch_id}).mappings().all()

    trend = db.execute(text(
        """
        SELECT periods.month_start,
               COALESCE(SUM(si.subtotal), 0)::FLOAT AS revenue,
               COALESCE(SUM(si.quantity), 0)::INTEGER AS units_sold
        FROM generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            INTERVAL '1 month'
        ) AS periods(month_start)
        LEFT JOIN sales sa
          ON date_trunc('month', sa.sale_date) = periods.month_start
         AND (:branch_id IS NULL OR sa.branch_id = :branch_id)
        LEFT JOIN sale_items si
          ON si.sale_id = sa.sale_id AND si.product_id = :product_id
        GROUP BY periods.month_start
        ORDER BY periods.month_start
        """
    ), {'product_id': product_id, 'branch_id': branch_id}).mappings().all()

    return {
        'medicine': dict(medicine),
        'branches': [dict(row) for row in branches],
        'trend': [
            {
                'month': row['month_start'].strftime('%b'),
                'revenue': float(row['revenue']),
                'units_sold': row['units_sold'],
            }
            for row in trend
        ],
    }


def fetch_branch_sales_summary(db: Session):
    rows = db.execute(text(
        "SELECT branch_id, branch_name, city, total_transactions, total_revenue FROM v_branch_sales_summary ORDER BY total_revenue DESC"
    )).mappings().all()
    return [dict(r) for r in rows]


def fetch_sales_trend(db: Session, branch_id: int | None = None):
    rows = db.execute(text(
        """
        SELECT periods.month_start,
               COALESCE(SUM(s.total_amount), 0)::FLOAT AS revenue,
               COUNT(s.sale_id)::INTEGER AS transactions
        FROM generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            INTERVAL '1 month'
        ) AS periods(month_start)
        LEFT JOIN sales s
          ON date_trunc('month', s.sale_date) = periods.month_start
         AND (:branch_id IS NULL OR s.branch_id = :branch_id)
        GROUP BY periods.month_start
        ORDER BY periods.month_start
        """
    ), {'branch_id': branch_id}).mappings().all()
    return [
        {
            'month': row['month_start'].strftime('%b'),
            'revenue': float(row['revenue']),
            'transactions': row['transactions'],
        }
        for row in rows
    ]


def fetch_inventory_status(db: Session):
    rows = db.execute(text(
        "SELECT * FROM v_inventory_status ORDER BY branch_name, product_name"
    )).mappings().all()
    return [dict(r) for r in rows]


def fetch_branches(db: Session):
    return db.query(Branch).filter(Branch.is_active.is_(True)).order_by(Branch.branch_name).all()


def fetch_products(db: Session):
    return db.query(Product).filter(Product.is_active.is_(True)).order_by(Product.product_name).all()


def fetch_suppliers(db: Session):
    return db.query(Supplier).order_by(Supplier.supplier_name).all()


def fetch_customers(db: Session):
    return db.query(Customer).order_by(Customer.last_name, Customer.first_name).all()


def fetch_inventory(db: Session):
    return db.query(Inventory).order_by(Inventory.branch_id, Inventory.product_id).all()


def process_sale(db: Session, payload: dict):
    try:
        db.execute(
            text(
                "CALL process_sale(:p_branch_id, :p_customer_id, :p_employee_id, "
                ":p_payment_method, :p_discount, :p_notes, :p_prescription_no, "
                "CAST(:p_items AS JSONB))"
            ),
            {
                'p_branch_id': payload['branch_id'],
                'p_customer_id': payload.get('customer_id'),
                'p_employee_id': payload['employee_id'],
                'p_payment_method': payload.get('payment_method', 'CASH'),
                'p_discount': float(payload.get('discount', 0) or 0),
                'p_notes': payload.get('notes'),
                'p_prescription_no': payload.get('prescription_no'),
                'p_items': json.dumps([
                    {
                        'product_id': item['product_id'],
                        'quantity': item['quantity'],
                        'unit_price': item['unit_price'],
                        'discount_pct': item.get('discount_pct', 0),
                    }
                    for item in payload['items']
                ]),
            },
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    # Fetch the generated invoice metadata
    row = db.execute(
        text("""
            SELECT invoice_no, total_amount, subtotal, tax_amount, discount, branch_id, payment_method, prescription_no
            FROM sales
            ORDER BY sale_id DESC
            LIMIT 1
        """)
    ).fetchone()

    res = {'success': True}
    if row:
        res.update({
            'invoice_no': row[0],
            'total_amount': float(row[1]) if row[1] is not None else 0.0,
            'subtotal': float(row[2]) if row[2] is not None else 0.0,
            'tax_amount': float(row[3]) if row[3] is not None else 0.0,
            'discount': float(row[4]) if row[4] is not None else 0.0,
            'branch_id': row[5],
            'payment_method': row[6],
            'prescription_no': row[7],
        })
    return res


def restock_inventory(db: Session, payload: dict):
    try:
        db.execute(
            text("CALL restock_inventory(:p_branch_id, :p_product_id, :p_quantity, :p_po_id, :p_batch_number, :p_expiry_date, :p_manufacture_date)"),
            {
                'p_branch_id': payload['branch_id'],
                'p_product_id': payload['product_id'],
                'p_quantity': payload['quantity'],
                'p_po_id': payload.get('po_id'),
                'p_batch_number': payload.get('batch_number'),
                'p_expiry_date': payload.get('expiry_date'),
                'p_manufacture_date': payload.get('manufacture_date'),
            }
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {'success': True}


def get_invoice_by_number(db: Session, invoice_no: str):
    sale = db.query(Sale).filter(Sale.invoice_no == invoice_no).first()
    if not sale:
        return None
    return {
        'invoice_no': sale.invoice_no,
        'branch_id': sale.branch_id,
        'customer_id': sale.customer_id,
        'employee_id': sale.employee_id,
        'sale_date': sale.sale_date.isoformat() if sale.sale_date else None,
        'subtotal': float(sale.subtotal),
        'discount': float(sale.discount),
        'tax_amount': float(sale.tax_amount),
        'total_amount': float(sale.total_amount),
        'payment_method': sale.payment_method,
        'items': [
            {
                'product_id': item.product_id,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'subtotal': float(item.subtotal),
            }
            for item in sale.sale_items
        ],
    }
