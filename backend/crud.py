from datetime import datetime
from typing import Any

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from .models import Branch, Category, Customer, Employee, Inventory, Product, Sale, Supplier, LowStockAlert


def fetch_dashboard_stats(db: Session):
    total_sales = db.query(Sale).count()
    total_products = db.query(Product).filter(Product.is_active.is_(True)).count()
    total_branches = db.query(Branch).filter(Branch.is_active.is_(True)).count()
    total_customers = db.query(Customer).count()
    total_revenue = float(db.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar() or 0)
    low_stock_count = db.query(LowStockAlert).filter(LowStockAlert.is_resolved.is_(False)).count()
    recent_sales = db.query(Sale).order_by(Sale.sale_date.desc()).limit(5).all()
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


def fetch_branch_sales_summary(db: Session):
    rows = db.execute(text(
        "SELECT branch_id, branch_name, city, total_transactions, total_revenue FROM v_branch_sales_summary ORDER BY total_revenue DESC"
    )).mappings().all()
    return [dict(r) for r in rows]


def fetch_inventory_status(db: Session):
    rows = db.execute(text(
        "SELECT * FROM v_inventory_status ORDER BY branch_name, product_name"
    )).mappings().all()
    return [dict(r) for r in rows]


def fetch_branches(db: Session):
    return db.query(Branch).order_by(Branch.branch_name).all()


def fetch_products(db: Session):
    return db.query(Product).order_by(Product.product_name).all()


def fetch_suppliers(db: Session):
    return db.query(Supplier).order_by(Supplier.supplier_name).all()


def fetch_customers(db: Session):
    return db.query(Customer).order_by(Customer.last_name, Customer.first_name).all()


def fetch_inventory(db: Session):
    return db.query(Inventory).order_by(Inventory.branch_id, Inventory.product_id).all()


def process_sale(db: Session, payload: dict):
    db.execute(
        text("CALL process_sale(:p_branch_id, :p_customer_id, :p_employee_id, :p_payment_method, :p_discount, :p_notes, :p_prescription_no, :p_items)"),
        {
            'p_branch_id': payload['branch_id'],
            'p_customer_id': payload.get('customer_id'),
            'p_employee_id': payload['employee_id'],
            'p_payment_method': payload.get('payment_method', 'CASH'),
            'p_discount': float(payload.get('discount', 0) or 0),
            'p_notes': payload.get('notes'),
            'p_prescription_no': payload.get('prescription_no'),
            'p_items': [
                {
                    'product_id': item['product_id'],
                    'quantity': item['quantity'],
                    'unit_price': item['unit_price'],
                    'discount_pct': item.get('discount_pct', 0),
                }
                for item in payload['items']
            ],
        }
    )
    db.commit()
    return {'success': True}


def restock_inventory(db: Session, payload: dict):
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
