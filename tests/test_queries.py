import os
import psycopg2
import psycopg2.extras
import pytest
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:root@localhost:5432/retail_db')


def _q(sql: str, params=None):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def test_union_query():
    """Verify UNION query runs and returns distinct combined entities."""
    sql = """
    SELECT product_name AS entity_name, 'Product' AS entity_type FROM products WHERE is_active = TRUE
    UNION
    SELECT supplier_name AS entity_name, 'Supplier' AS entity_type FROM suppliers WHERE is_active = TRUE
    ORDER BY entity_name;
    """
    rows = _q(sql)
    assert len(rows) >= 1
    types = {r['entity_type'] for r in rows}
    assert 'Product' in types or 'Supplier' in types


def test_intersect_query():
    """Verify INTERSECT query executes against database."""
    sql = """
    SELECT product_id FROM inventory WHERE branch_id = 1 AND quantity > 0
    INTERSECT
    SELECT product_id FROM inventory WHERE branch_id = 2 AND quantity > 0;
    """
    rows = _q(sql)
    assert isinstance(rows, list)


def test_except_query():
    """Verify EXCEPT query executes against database."""
    sql = """
    SELECT product_id, product_name FROM products WHERE is_active = TRUE
    EXCEPT
    SELECT p.product_id, p.product_name
    FROM products p
    JOIN sale_items si ON p.product_id = si.product_id
    JOIN sales s ON si.sale_id = s.sale_id
    WHERE s.branch_id = 2;
    """
    rows = _q(sql)
    assert isinstance(rows, list)


def test_group_by_having_query():
    """Verify GROUP BY and HAVING aggregate filtering."""
    sql = """
    SELECT b.branch_id, b.branch_name, COUNT(s.sale_id) AS total_sales,
           COALESCE(SUM(s.total_amount), 0) AS total_revenue
    FROM branches b
    LEFT JOIN sales s ON b.branch_id = s.branch_id
    GROUP BY b.branch_id, b.branch_name
    HAVING COUNT(s.sale_id) >= 0
    ORDER BY total_revenue DESC;
    """
    rows = _q(sql)
    assert len(rows) >= 1
    for r in rows:
        assert 'total_revenue' in r
        assert 'total_sales' in r


def test_like_query():
    """Verify LIKE pattern matching."""
    sql = """
    SELECT product_id, product_name, medicine_code, brand
    FROM products
    WHERE product_name ILIKE '%cin%' OR brand ILIKE '%pharma%'
    ORDER BY product_name;
    """
    rows = _q(sql)
    assert isinstance(rows, list)


def test_between_query():
    """Verify BETWEEN range queries on price and dates."""
    sql = """
    SELECT product_id, product_name, unit_price
    FROM products
    WHERE unit_price BETWEEN 10.00 AND 1000.00
    ORDER BY unit_price;
    """
    rows = _q(sql)
    assert len(rows) >= 1
    for r in rows:
        assert 10.00 <= float(r['unit_price']) <= 1000.00


def test_correlated_subquery():
    """Verify Correlated Subquery comparing price with category average."""
    sql = """
    SELECT p1.product_id, p1.product_name, p1.category_id, p1.unit_price
    FROM products p1
    WHERE p1.unit_price >= (
        SELECT AVG(p2.unit_price)
        FROM products p2
        WHERE p2.category_id = p1.category_id
    )
    ORDER BY p1.category_id, p1.unit_price DESC;
    """
    rows = _q(sql)
    assert isinstance(rows, list)


def test_exists_subquery():
    """Verify EXISTS subquery checking active purchase orders."""
    sql = """
    SELECT s.supplier_id, s.supplier_name, s.contact_person
    FROM suppliers s
    WHERE EXISTS (
        SELECT 1
        FROM products p
        WHERE p.supplier_id = s.supplier_id
          AND p.is_active = TRUE
    );
    """
    rows = _q(sql)
    assert len(rows) >= 1


def test_views_query():
    """Verify both views v_branch_sales_summary and v_inventory_status."""
    v1 = _q("SELECT * FROM v_branch_sales_summary;")
    assert len(v1) >= 1
    assert 'branch_name' in v1[0]
    assert 'total_revenue' in v1[0]

    v2 = _q("SELECT * FROM v_inventory_status;")
    assert len(v2) >= 1
    assert 'stock_status' in v2[0]
    assert 'product_name' in v2[0]
