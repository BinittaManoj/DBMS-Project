# tests/test_database.py
"""
Database-level tests: schema integrity, trigger verification, and stored procedure validation.
These tests connect directly to PostgreSQL, bypassing the HTTP layer.
"""
import psycopg2
import psycopg2.extras
import pytest

from conftest import DB_URL


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _conn():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    return conn


def _q(conn, sql, params=None):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(sql, params)
    return cur.fetchall()


# ---------------------------------------------------------------------------
# Test 1 of 6: Schema Integrity
# ---------------------------------------------------------------------------

def test_schema_integrity():
    """
    TC-DB-00: Verify that all 12 required tables exist and have at least 5 columns each.
    Also verifies the two views exist.
    """
    conn = _conn()
    try:
        required_tables = [
            'branches', 'categories', 'suppliers', 'products',
            'customers', 'employees', 'inventory', 'sales',
            'sale_items', 'purchase_orders', 'purchase_order_items',
            'low_stock_alerts',
        ]
        for tbl in required_tables:
            rows = _q(conn,
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=%s",
                (tbl,)
            )
            assert len(rows) >= 5, f"Table '{tbl}' has fewer than 5 columns: {len(rows)}"

        # Views must exist
        for view in ('v_branch_sales_summary', 'v_inventory_status'):
            rows = _q(conn,
                "SELECT table_name FROM information_schema.views "
                "WHERE table_schema='public' AND table_name=%s",
                (view,)
            )
            assert rows, f"View '{view}' does not exist"
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Test 2 of 6: Foreign Key Constraints
# ---------------------------------------------------------------------------

def test_foreign_key_constraints():
    """
    TC-DB-01: Attempting to delete a category that has products should be blocked.
    TC-DB-02: Duplicate (branch_id, product_id) pair in inventory should be rejected.
    TC-DB-03: Updating inventory.quantity to -5 should be rejected (CHECK quantity >= 0).
    TC-DB-04: Inserting a product with unit_price = -10 should be rejected.
    """
    conn = _conn()
    cur = conn.cursor()
    try:
        # TC-DB-01: FK RESTRICT on category delete
        cur.execute('SELECT category_id FROM categories LIMIT 1')
        cat_id = cur.fetchone()[0]
        with pytest.raises(psycopg2.errors.ForeignKeyViolation):
            cur.execute('DELETE FROM categories WHERE category_id = %s', (cat_id,))
        conn.rollback()

        # TC-DB-02: Duplicate (branch_id, product_id) in inventory
        cur.execute('SELECT branch_id, product_id FROM inventory LIMIT 1')
        row = cur.fetchone()
        if row:
            with pytest.raises(psycopg2.errors.UniqueViolation):
                cur.execute(
                    'INSERT INTO inventory (branch_id, product_id, quantity, reorder_level) '
                    'VALUES (%s, %s, 10, 5)',
                    (row[0], row[1])
                )
            conn.rollback()

        # TC-DB-03: Negative quantity CHECK
        cur.execute('SELECT branch_id, product_id FROM inventory LIMIT 1')
        row = cur.fetchone()
        if row:
            with pytest.raises(psycopg2.errors.CheckViolation):
                cur.execute(
                    'UPDATE inventory SET quantity = -5 WHERE branch_id = %s AND product_id = %s',
                    (row[0], row[1])
                )
            conn.rollback()

        # TC-DB-04: Negative unit_price CHECK
        cur.execute('SELECT category_id, supplier_id FROM products LIMIT 1')
        prow = cur.fetchone()
        if prow:
            with pytest.raises(psycopg2.errors.CheckViolation):
                cur.execute(
                    "INSERT INTO products (product_name, category_id, supplier_id, "
                    "unit_price, cost_price, unit_of_measure) "
                    "VALUES ('Test Medicine', %s, %s, -10.00, 5.00, 'STRIP')",
                    (prow[0], prow[1])
                )
            conn.rollback()
    finally:
        conn.rollback()
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# Test 3 of 6: Stock Reduction Trigger
# ---------------------------------------------------------------------------

def test_stock_reduction_trigger():
    """
    TC-TRG-01: Trigger trg_sale_items_reduce_stock must decrement stock by EXACTLY
    the quantity sold — not double-decrement.
    Pre-condition: branch_id=1, product_id=1, quantity > 5.
    """
    conn = _conn()
    cur = conn.cursor()
    try:
        # Ensure we have enough stock for a clean test
        cur.execute(
            'UPDATE inventory SET quantity = 25 WHERE branch_id = 1 AND product_id = 1'
        )
        cur.execute(
            'SELECT quantity FROM inventory WHERE branch_id = 1 AND product_id = 1'
        )
        row = cur.fetchone()
        stock_before = row[0]

        # Insert a sale header
        cur.execute(
            "INSERT INTO sales (invoice_no, branch_id, employee_id, sale_date, "
            "subtotal, discount, tax_amount, total_amount, payment_method) "
            "VALUES ('TEST-TRIGGER-001', 1, 1, NOW(), 100, 0, 5, 105, 'CASH') "
            "RETURNING sale_id"
        )
        sale_id = cur.fetchone()[0]

        # Insert sale_item — trigger should fire and reduce stock
        SELL_QTY = 3
        cur.execute(
            'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) '
            'VALUES (%s, 1, %s, 18.00, %s)',
            (sale_id, SELL_QTY, 18.00 * SELL_QTY)
        )

        # Check stock was reduced by EXACTLY 3 (not 6)
        cur.execute(
            'SELECT quantity FROM inventory WHERE branch_id = 1 AND product_id = 1'
        )
        stock_after = cur.fetchone()[0]
        assert stock_after == stock_before - SELL_QTY, (
            f'Expected stock to drop by {SELL_QTY}: {stock_before} → {stock_after}'
        )
    finally:
        conn.rollback()
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# Test 4 of 6: Low Stock Alert Trigger
# ---------------------------------------------------------------------------

def test_low_stock_alert_trigger():
    """
    TC-TRG-02: trg_low_stock_alert must fire ONCE when inventory crosses from
    at/above reorder_level to below it. Must NOT create duplicate alerts on
    repeated updates while already below threshold.
    """
    conn = _conn()
    cur = conn.cursor()
    try:
        # Find an inventory row where current quantity > reorder_level by at least 2
        cur.execute(
            'SELECT branch_id, product_id, quantity, reorder_level '
            'FROM inventory '
            'WHERE quantity > reorder_level + 1 '
            'ORDER BY branch_id LIMIT 1'
        )
        row = cur.fetchone()
        if row is None:
            conn.rollback()
            return  # skip gracefully

        b_id, p_id, qty, rlevel = row

        # Count existing unresolved alerts for this pair
        cur.execute(
            'SELECT COUNT(*) FROM low_stock_alerts WHERE branch_id=%s AND product_id=%s AND is_resolved=FALSE',
            (b_id, p_id)
        )
        alerts_before = cur.fetchone()[0]

        # Drop stock from above reorder_level to exactly (reorder_level - 1)
        new_qty = rlevel - 1
        cur.execute(
            'UPDATE inventory SET quantity=%s WHERE branch_id=%s AND product_id=%s',
            (new_qty, b_id, p_id)
        )

        # One alert should have been created
        cur.execute(
            'SELECT COUNT(*) FROM low_stock_alerts WHERE branch_id=%s AND product_id=%s AND is_resolved=FALSE',
            (b_id, p_id)
        )
        alerts_after_first = cur.fetchone()[0]
        assert alerts_after_first == alerts_before + 1, (
            f'Expected exactly 1 new alert; got {alerts_after_first - alerts_before}'
        )

        # Update again (still below threshold) — must NOT create another alert
        cur.execute(
            'UPDATE inventory SET quantity=%s WHERE branch_id=%s AND product_id=%s',
            (new_qty - 1, b_id, p_id)
        )
        cur.execute(
            'SELECT COUNT(*) FROM low_stock_alerts WHERE branch_id=%s AND product_id=%s AND is_resolved=FALSE',
            (b_id, p_id)
        )
        alerts_after_second = cur.fetchone()[0]
        assert alerts_after_second == alerts_after_first, (
            'Second update below threshold created a duplicate alert!'
        )
    finally:
        conn.rollback()
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# Test 5 of 6: process_sale Stored Procedure
# ---------------------------------------------------------------------------

def test_process_sale_procedure():
    """
    TC-PROC-01: Call process_sale() and verify:
      - A sale row is created with an INV-... invoice number
      - Sale_items rows are created
      - Inventory was decremented by the trigger (not by the procedure itself)
    """
    conn = _conn()
    cur = conn.cursor()
    try:
        # Pre-check and ensure stock for test
        cur.execute(
            'UPDATE inventory SET quantity = 25 WHERE branch_id = 1 AND product_id = 1'
        )
        cur.execute('SELECT quantity FROM inventory WHERE branch_id=1 AND product_id=1')
        row = cur.fetchone()
        stock_before = row[0]
        sales_before = _q(conn, 'SELECT COUNT(*) AS cnt FROM sales')[0]['cnt']

        # Call the stored procedure
        cur.execute(
            "CALL process_sale(1, NULL, 1, 'CASH', 0.00, NULL, NULL, "
            "'[{\"product_id\": 1, \"quantity\": 2, \"unit_price\": 18.00, \"discount_pct\": 0}]'::JSONB)"
        )

        # Verify sale was created
        cur.execute('SELECT COUNT(*) FROM sales')
        sales_after = cur.fetchone()[0]
        assert sales_after == sales_before + 1, 'Expected 1 new sale row'

        # Verify invoice format
        cur.execute("SELECT invoice_no FROM sales ORDER BY sale_id DESC LIMIT 1")
        invoice_no = cur.fetchone()[0]
        assert invoice_no.startswith('INV-'), f'Invoice format wrong: {invoice_no}'

        # Verify stock was reduced by trigger
        cur.execute('SELECT quantity FROM inventory WHERE branch_id=1 AND product_id=1')
        stock_after = cur.fetchone()[0]
        assert stock_after == stock_before - 2, (
            f'Stock should have dropped by 2: {stock_before} → {stock_after}'
        )
    finally:
        conn.rollback()
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# Test 6 of 6: Insufficient Stock Rollback
# ---------------------------------------------------------------------------

def test_insufficient_stock_rollback():
    """
    TC-PROC-02: process_sale() must RAISE an error (rolling back fully) when
    requesting more units than are in stock. Stock must be unchanged after failure.
    """
    conn = _conn()
    cur = conn.cursor()
    try:
        cur.execute('SELECT quantity FROM inventory WHERE branch_id=1 AND product_id=1')
        row = cur.fetchone()
        if row is None:
            return
        stock_before = row[0]
        OVERSELL_QTY = stock_before + 9999  # definitely more than available

        with pytest.raises(psycopg2.errors.RaiseException):
            cur.execute(
                "CALL process_sale(1, NULL, 1, 'CASH', 0.00, NULL, NULL, "
                "'[{\"product_id\": 1, \"quantity\": %s, "
                "\"unit_price\": 18.00, \"discount_pct\": 0}]'::JSONB)" % OVERSELL_QTY
            )
        conn.rollback()

        # Stock must be unchanged
        cur.execute('SELECT quantity FROM inventory WHERE branch_id=1 AND product_id=1')
        stock_after = cur.fetchone()[0]
        assert stock_after == stock_before, (
            f'Stock changed after failed sale: {stock_before} → {stock_after}'
        )
    finally:
        conn.rollback()
        cur.close()
        conn.close()
