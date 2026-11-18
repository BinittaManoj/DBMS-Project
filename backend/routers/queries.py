# backend/routers/queries.py
# Live SQL Query Explorer - runs real queries from queries.sql against the database
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db

router = APIRouter()


def _rows_to_dicts(result):
    """Convert SQLAlchemy result rows to list of dicts with column names."""
    keys = list(result.keys())
    return [dict(zip(keys, row)) for row in result.fetchall()]


QUERIES = {
    # ---- SET OPERATIONS ----
    'union-products': {
        'title': 'UNION: Products in Branch 1 OR Branch 2',
        'category': 'Set Operations',
        'description': 'Retrieves all unique products stocked at Branch 1 OR Branch 2 (combined list, no duplicates). Useful for seeing the full product range across branches.',
        'sql': """
SELECT p.product_id, p.product_name, p.brand, 'Branch 1' AS source
FROM inventory i JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 1
UNION
SELECT p.product_id, p.product_name, p.brand, 'Branch 2' AS source
FROM inventory i JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 2
ORDER BY product_name
""",
    },
    'union-contacts': {
        'title': 'UNION: All unique phones from customers + suppliers',
        'category': 'Set Operations',
        'description': 'Retrieves all unique phone numbers from both customers and suppliers in one list. Useful for contact directory.',
        'sql': """
SELECT phone, 'Customer' AS source_type FROM customers WHERE phone IS NOT NULL
UNION
SELECT phone, 'Supplier' AS source_type FROM suppliers WHERE phone IS NOT NULL
ORDER BY phone
""",
    },
    'intersect-products': {
        'title': 'INTERSECT: Products sold at BOTH Branch 1 AND Branch 2',
        'category': 'Set Operations',
        'description': 'Shows products that have been sold in both Branch 1 and Branch 2. These are common popular medicines that perform well everywhere.',
        'sql': """
SELECT si.product_id
FROM sale_items si JOIN sales s ON s.sale_id = si.sale_id WHERE s.branch_id = 1
INTERSECT
SELECT si.product_id
FROM sale_items si JOIN sales s ON s.sale_id = si.sale_id WHERE s.branch_id = 2
""",
    },
    'intersect-suppliers': {
        'title': 'INTERSECT: Suppliers serving both Branch 1 and Branch 2',
        'category': 'Set Operations',
        'description': 'Finds suppliers who have sent purchase orders to both Branch 1 and Branch 2.',
        'sql': """
SELECT supplier_id FROM purchase_orders WHERE branch_id = 1
INTERSECT
SELECT supplier_id FROM purchase_orders WHERE branch_id = 2
""",
    },
    'except-products': {
        'title': 'EXCEPT: Products in Branch 1 but NOT in Branch 2',
        'category': 'Set Operations',
        'description': 'Finds products stocked exclusively at Branch 1. Useful for identifying branch-exclusive items or gaps in stock at Branch 2.',
        'sql': """
SELECT product_id FROM inventory WHERE branch_id = 1
EXCEPT
SELECT product_id FROM inventory WHERE branch_id = 2
""",
    },
    'except-unsold': {
        'title': 'EXCEPT: Products that have NEVER been sold',
        'category': 'Set Operations',
        'description': 'Identifies products in the catalog that have never appeared in any sale — dead stock or new arrivals with no supply chain setup.',
        'sql': """
SELECT product_id, product_name FROM products WHERE is_active = TRUE
EXCEPT
SELECT p.product_id, p.product_name
FROM products p
JOIN purchase_order_items poi ON p.product_id = poi.product_id
""",
    },
    # ---- GROUP BY / HAVING ----
    'group-by-monthly': {
        'title': 'GROUP BY: Monthly revenue per branch',
        'category': 'Group By & Having',
        'description': 'Aggregates sales by month and branch. Gives a clear picture of how each branch is performing over time.',
        'sql': """
SELECT
    b.branch_name,
    DATE_TRUNC('month', s.sale_date) AS month,
    COUNT(s.sale_id) AS transactions,
    SUM(s.total_amount) AS revenue,
    AVG(s.total_amount) AS avg_sale
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
GROUP BY b.branch_name, DATE_TRUNC('month', s.sale_date)
ORDER BY month DESC, revenue DESC
""",
    },
    'group-by-products': {
        'title': 'GROUP BY: Total quantity sold per product',
        'category': 'Group By & Having',
        'description': 'Aggregates total units sold and revenue per medicine across all branches. Shows which medicines are top sellers.',
        'sql': """
SELECT
    p.product_name,
    p.brand,
    SUM(si.quantity) AS total_qty_sold,
    SUM(si.subtotal) AS total_revenue,
    COUNT(DISTINCT s.sale_id) AS num_transactions
FROM sale_items si
JOIN products p ON p.product_id = si.product_id
JOIN sales s ON s.sale_id = si.sale_id
GROUP BY p.product_id, p.product_name, p.brand
ORDER BY total_revenue DESC
""",
    },
    'having-high-revenue': {
        'title': 'HAVING: Branches with total revenue > ₹50,000',
        'category': 'Group By & Having',
        'description': 'Filters branches whose total revenue crosses ₹50,000. Management can immediately focus on high-performing locations.',
        'sql': """
SELECT
    b.branch_name,
    SUM(s.total_amount) AS total_revenue
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
GROUP BY b.branch_name
HAVING SUM(s.total_amount) > 50000
ORDER BY total_revenue DESC
""",
    },
    'having-fast-movers': {
        'title': 'HAVING: Products sold more than 10 units total',
        'category': 'Group By & Having',
        'description': 'Filters to show only fast-moving products (more than 10 units sold). Useful for procurement planning.',
        'sql': """
SELECT
    p.product_name,
    SUM(si.quantity) AS total_sold
FROM sale_items si
JOIN products p ON p.product_id = si.product_id
GROUP BY p.product_name
HAVING SUM(si.quantity) > 10
ORDER BY total_sold DESC
""",
    },
    # ---- LIKE / BETWEEN ----
    'like-para': {
        'title': "LIKE: Products starting with 'Para'",
        'category': 'LIKE & BETWEEN',
        'description': "Searches products by name pattern — all medicines starting with 'Para' like Paracetamol. Fast and flexible name search.",
        'sql': """
SELECT product_name, brand, unit_price, drug_schedule
FROM products
WHERE product_name ILIKE 'Para%'
  AND is_active = TRUE
""",
    },
    'like-suppliers': {
        'title': "LIKE: Suppliers in cities matching 'Mumbai'",
        'category': 'LIKE & BETWEEN',
        'description': "Finds suppliers in cities matching a pattern. Change 'Mumb%' to any city prefix.",
        'sql': """
SELECT supplier_name, contact_person, city, phone
FROM suppliers
WHERE city ILIKE 'Mumb%'
  AND is_active = TRUE
""",
    },
    'between-recent': {
        'title': 'BETWEEN: Sales in the last 7 days',
        'category': 'LIKE & BETWEEN',
        'description': 'Pulls all sales within the last 7 days. Instantly useful for weekly reports without hardcoding dates.',
        'sql': """
SELECT
    s.invoice_no,
    b.branch_name,
    s.sale_date,
    s.total_amount
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
WHERE s.sale_date BETWEEN NOW() - INTERVAL '7 days' AND NOW()
ORDER BY s.sale_date DESC
""",
    },
    'between-price': {
        'title': 'BETWEEN: Products priced between ₹50 and ₹500',
        'category': 'LIKE & BETWEEN',
        'description': 'Filters medicines in a price range. BETWEEN is used here for price range filtering, commonly used in search/retrieval forms.',
        'sql': """
SELECT product_name, brand, unit_price, drug_schedule
FROM products
WHERE unit_price BETWEEN 50 AND 500
  AND is_active = TRUE
ORDER BY unit_price
""",
    },
    # ---- CORRELATED / EXISTS / NOT EXISTS ----
    'correlated-branch-sales': {
        'title': 'CORRELATED SUBQUERY: Units sold per product per branch',
        'category': 'Correlated & EXISTS',
        'description': 'For every product, shows how many units were sold at each individual branch. Compares each product against every branch one by one — a true correlated subquery.',
        'sql': """
SELECT
    p.product_name,
    b.branch_name,
    (
        SELECT COALESCE(SUM(si.quantity), 0)
        FROM sale_items si
        JOIN sales s ON s.sale_id = si.sale_id
        WHERE si.product_id = p.product_id
          AND s.branch_id   = b.branch_id
    ) AS qty_sold_at_branch
FROM products p
CROSS JOIN branches b
WHERE p.is_active = TRUE AND b.is_active = TRUE
ORDER BY p.product_name, b.branch_name
""",
    },
    'exists-low-stock': {
        'title': 'EXISTS: Branches with unresolved low-stock alerts',
        'category': 'Correlated & EXISTS',
        'description': 'Checks whether a branch currently has any unresolved low-stock alerts. If even one exists, that branch is flagged for immediate procurement action.',
        'sql': """
SELECT b.branch_id, b.branch_name, b.city
FROM branches b
WHERE EXISTS (
    SELECT 1
    FROM low_stock_alerts la
    WHERE la.branch_id = b.branch_id
      AND la.is_resolved = FALSE
)
AND b.is_active = TRUE
""",
    },
    'not-exists-no-orders': {
        'title': 'NOT EXISTS: Products with no purchase orders yet',
        'category': 'Correlated & EXISTS',
        'description': 'Finds medicines that have never been ordered from any supplier. Helps identify items that still need a proper supply chain setup.',
        'sql': """
SELECT p.product_id, p.product_name, p.brand
FROM products p
WHERE NOT EXISTS (
    SELECT 1
    FROM purchase_order_items poi
    WHERE poi.product_id = p.product_id
)
AND p.is_active = TRUE
""",
    },
    # ---- AGGREGATES ----
    'aggregate-summary': {
        'title': 'AGGREGATES: Full summary stats (COUNT, SUM, AVG, MIN, MAX)',
        'category': 'Aggregates',
        'description': 'Uses all five aggregate functions in one query: COUNT (total sales), SUM (total revenue), AVG (average bill), MIN (smallest bill), MAX (largest bill).',
        'sql': """
SELECT
    COUNT(DISTINCT s.sale_id)       AS total_sales,
    COUNT(DISTINCT s.customer_id)   AS unique_customers,
    SUM(s.total_amount)             AS total_revenue,
    AVG(s.total_amount)             AS avg_bill_value,
    MIN(s.total_amount)             AS min_bill,
    MAX(s.total_amount)             AS max_bill
FROM sales s
""",
    },
    'aggregate-by-payment': {
        'title': 'AGGREGATES: Revenue by payment method',
        'category': 'Aggregates',
        'description': 'Breaks down how much revenue was collected via Cash, Card, UPI, and Insurance. Useful for financial reconciliation.',
        'sql': """
SELECT
    payment_method,
    COUNT(*)            AS num_transactions,
    SUM(total_amount)   AS total_collected,
    AVG(total_amount)   AS avg_per_txn
FROM sales
GROUP BY payment_method
ORDER BY total_collected DESC
""",
    },
    'aggregate-inventory': {
        'title': 'AGGREGATES: Stock summary across all branches (MIN, MAX, SUM)',
        'category': 'Aggregates',
        'description': 'For each medicine, shows the minimum stock at any branch, maximum stock at any branch, and total units across all branches.',
        'sql': """
SELECT
    p.product_name,
    MIN(i.quantity) AS min_stock_any_branch,
    MAX(i.quantity) AS max_stock_any_branch,
    SUM(i.quantity) AS total_stock_all_branches
FROM inventory i
JOIN products p ON p.product_id = i.product_id
GROUP BY p.product_name
ORDER BY total_stock_all_branches ASC
""",
    },
    'aggregate-category': {
        'title': 'AGGREGATES: Average price per category',
        'category': 'Aggregates',
        'description': 'Shows the number of products and average price per drug category. Useful for price benchmarking.',
        'sql': """
SELECT p.category_id, c.category_name,
       COUNT(p.product_id) AS product_count,
       AVG(p.unit_price)   AS avg_price
FROM products p
JOIN categories c ON p.category_id = c.category_id
GROUP BY p.category_id, c.category_name
HAVING COUNT(p.product_id) >= 2
ORDER BY avg_price DESC
""",
    },

    # ---- DATABASE VIEWS ----
    'view_branch_sales': {
        'title': 'VIEW: v_branch_sales_summary',
        'category': 'Database Views',
        'description': 'Queries the pre-computed v_branch_sales_summary view which aggregates total transactions, revenue, and average transaction value per branch.',
        'sql': """
SELECT * FROM v_branch_sales_summary ORDER BY total_revenue DESC;
""",
    },
    'view_inventory_status': {
        'title': 'VIEW: v_inventory_status (Live Reorder & Expiry Monitor)',
        'category': 'Database Views',
        'description': 'Queries the v_inventory_status view computing stock availability, days to expiry, reorder urgency, and automated status tags.',
        'sql': """
SELECT branch_name, product_name, current_qty, reorder_level, days_to_expiry, stock_status
FROM v_inventory_status
ORDER BY current_qty ASC
LIMIT 15;
""",
    },

    # ---- DML: UPDATE & DELETE OPERATIONS (ACADEMIC LAB DELIVERABLE) ----
    'update_price_query': {
        'title': 'UPDATE: 5% Price Revision on OTC Medicines (with RETURNING)',
        'category': 'DML (Update & Delete)',
        'description': 'Executes a conditional UPDATE query with a RETURNING clause in PostgreSQL, updating unit_price for Category 1 and immediately returning modified rows.',
        'sql': """
UPDATE products
SET unit_price = ROUND(unit_price * 1.05, 2)
WHERE category_id = 1
RETURNING product_id, medicine_code, product_name, unit_price AS updated_unit_price;
""",
    },
    'update_reorder_query': {
        'title': 'UPDATE: Dynamic Safety Threshold Adjustment for Fast-Moving Inventory',
        'category': 'DML (Update & Delete)',
        'description': 'Updates reorder_level threshold across branches where current stock is healthy (> 30 units), ensuring earlier reorder alert triggering.',
        'sql': """
UPDATE inventory
SET reorder_level = 25
WHERE quantity > 30
RETURNING branch_id, product_id, quantity, reorder_level AS new_reorder_level;
""",
    },
    'update_batch_query': {
        'title': 'UPDATE: Quality Control Batch Prefix Standardization',
        'category': 'DML (Update & Delete)',
        'description': 'Standardizes batch numbers by prefixing verified batches with QC- at Branch 1, demonstrating string manipulation in SQL UPDATE.',
        'sql': """
UPDATE inventory
SET batch_number = 'QC-' || batch_number
WHERE batch_number NOT LIKE 'QC-%' AND branch_id = 1
RETURNING branch_id, product_id, batch_number, expiry_date;
""",
    },
    'delete_alerts_query': {
        'title': 'DELETE: Purge Resolved Low-Stock Alerts (Table Cleanup)',
        'category': 'DML (Update & Delete)',
        'description': 'Demonstrates safe record removal using DELETE with filtering. Purges already resolved alerts from low_stock_alerts while preserving pending warnings.',
        'sql': """
DELETE FROM low_stock_alerts
WHERE is_resolved = TRUE
RETURNING alert_id, branch_id, product_id, current_stock, alert_time;
""",
    },
    'delete_stock_query': {
        'title': 'DELETE: Remove Depleted Zero-Quantity Stock with FK Safety',
        'category': 'DML (Update & Delete)',
        'description': 'Demonstrates PostgreSQL referential integrity: removes zero-quantity inventory rows that have no foreign-key locks in historical sale items.',
        'sql': """
DELETE FROM inventory
WHERE quantity = 0
  AND NOT EXISTS (SELECT 1 FROM sale_items si WHERE si.product_id = inventory.product_id)
RETURNING branch_id, product_id, quantity;
""",
    },
}

# Add standard Course Baseline aliases for seamless frontend compatibility
QUERIES['union_query'] = QUERIES['union-products']
QUERIES['intersect_query'] = QUERIES['intersect-products']
QUERIES['except_query'] = QUERIES['except-products']
QUERIES['group_by_having_query'] = QUERIES['group-by-monthly']
QUERIES['aggregate_query'] = QUERIES['aggregate-category']
QUERIES['like_query'] = QUERIES['like-para']
QUERIES['between_query'] = QUERIES['between-price']
QUERIES['correlated_subquery'] = QUERIES['correlated-branch-sales']
QUERIES['exists_subquery'] = QUERIES['exists-low-stock']
QUERIES['dml-update-prices'] = QUERIES['update_price_query']
QUERIES['dml-update-reorder'] = QUERIES['update_reorder_query']
QUERIES['dml-delete-alerts'] = QUERIES['delete_alerts_query']


from pydantic import BaseModel


class CustomQueryPayload(BaseModel):
    query: str


@router.get('/')
@router.get('/list')
def get_queries():
    """Return dictionary of queries and list metadata."""
    return {
        'queries': QUERIES,
        'list': [
            {
                'key': key,
                'title': q['title'],
                'category': q['category'],
                'description': q['description'],
                'sql': q['sql'].strip(),
            }
            for key, q in QUERIES.items()
        ],
    }


@router.get('/categories')
def list_categories():
    """Return distinct query categories."""
    seen = []
    result = []
    for q in QUERIES.values():
        if q['category'] not in seen:
            seen.append(q['category'])
            result.append(q['category'])
    return result


@router.get('/run/{query_key}')
@router.get('/{query_key}')
def run_query(query_key: str, db: Session = Depends(get_db)):
    """Execute a named SQL query and return the results."""
    if query_key not in QUERIES:
        raise HTTPException(
            status_code=404,
            detail=f"Query '{query_key}' not found. Available: {list(QUERIES.keys())}"
        )

    q = QUERIES[query_key]
    try:
        result = db.execute(text(q['sql']))
        keys = list(result.keys()) if result.returns_rows else []
        rows = _rows_to_dicts(result) if result.returns_rows else []
        db.commit()
        return {
            'key': query_key,
            'title': q['title'],
            'category': q['category'],
            'description': q['description'],
            'sql': q['sql'].strip(),
            'columns': keys,
            'data': rows,
            'rows': rows,
            'row_count': len(rows),
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f'Query execution failed: {exc}'
        ) from exc


@router.post('/execute')
def execute_custom_query(payload: CustomQueryPayload, db: Session = Depends(get_db)):
    """Execute raw custom SQL submitted via the console with safety safeguards."""
    sql = payload.query.strip()
    if not sql:
        raise HTTPException(status_code=400, detail='SQL query string cannot be empty.')

    # Simple guard against destructive DDL in student demo
    forbidden = ['DROP DATABASE', 'DROP TABLE', 'TRUNCATE', 'ALTER TABLE']
    for term in forbidden:
        if term in sql.upper():
            raise HTTPException(
                status_code=403,
                detail=f'Command forbidden for safety during laboratory presentation: {term}'
            )

    try:
        result = db.execute(text(sql))
        keys = list(result.keys()) if result.returns_rows else []
        rows = _rows_to_dicts(result) if result.returns_rows else []
        db.commit()
        return {
            'sql': sql,
            'columns': keys,
            'data': rows,
            'rows': rows,
            'row_count': len(rows),
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f'SQL execution error: {exc}'
        ) from exc
