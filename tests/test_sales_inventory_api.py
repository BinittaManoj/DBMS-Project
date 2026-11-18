import os
from uuid import uuid4

import psycopg2
from fastapi.testclient import TestClient

from backend.database import DATABASE_URL
from backend.main import app


client = TestClient(app)
DB_URL = os.getenv('DATABASE_URL', DATABASE_URL)


def _stocked_item():
    conn = psycopg2.connect(DB_URL)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT i.branch_id, i.product_id, i.quantity, i.updated_at,
                   i.batch_number, i.expiry_date, i.manufacture_date,
                   i.last_restocked_at, p.unit_price, e.employee_id
            FROM inventory i
            JOIN products p ON p.product_id = i.product_id AND p.is_active
            JOIN employees e ON e.branch_id = i.branch_id AND e.is_active
            WHERE i.quantity > i.reorder_level + 1
            ORDER BY i.quantity DESC
            LIMIT 1
            """
        )
        return cur.fetchone()
    finally:
        conn.close()


def _restore_stock(branch_id, product_id, stock):
    conn = psycopg2.connect(DB_URL)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE inventory
            SET quantity = %s, updated_at = %s, batch_number = %s,
                expiry_date = %s, manufacture_date = %s, last_restocked_at = %s
            WHERE branch_id = %s AND product_id = %s
            """,
            (*stock, branch_id, product_id),
        )
        conn.commit()
    finally:
        conn.close()


def test_restock_updates_the_inventory_status_readback():
    stock = _stocked_item()
    assert stock is not None, 'Test database needs at least one well-stocked medicine'
    branch_id, product_id = stock[:2]
    original_stock = stock[2:8]
    quantity = stock[2]
    try:
        response = client.post(
            '/api/inventory/restock',
            json={
                'branch_id': branch_id,
                'product_id': product_id,
                'quantity': 7,
                'batch_number': None,
                'expiry_date': None,
                'manufacture_date': None,
            },
        )
        assert response.status_code == 200, response.text
        assert response.json().get('success') is True

        inventory = client.get('/api/inventory/status')
        assert inventory.status_code == 200, inventory.text
        row = next(
            entry for entry in inventory.json()
            if entry['branch_id'] == branch_id and entry['product_id'] == product_id
        )
        assert row['current_qty'] == quantity + 7
    finally:
        _restore_stock(branch_id, product_id, original_stock)


def test_sale_items_json_input_creates_a_bill_and_reduces_stock():
    stock = _stocked_item()
    assert stock is not None, 'Test database needs at least one well-stocked medicine'
    branch_id, product_id = stock[:2]
    original_stock = stock[2:8]
    quantity = stock[2]
    unit_price, employee_id = stock[8:10]
    marker = f'api-input-test-{uuid4().hex}'
    try:
        response = client.post(
            '/api/sales/process',
            json={
                'branch_id': branch_id,
                'employee_id': employee_id,
                'payment_method': 'CASH',
                'discount': 0,
                'notes': marker,
                'items': [{
                    'product_id': product_id,
                    'quantity': 1,
                    'unit_price': float(unit_price),
                    'discount_pct': 0,
                }],
            },
        )
        assert response.status_code == 200, response.text
        assert response.json().get('success') is True

        conn = psycopg2.connect(DB_URL)
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT s.sale_id, si.quantity
                FROM sales s
                JOIN sale_items si ON si.sale_id = s.sale_id
                WHERE s.notes = %s AND si.product_id = %s
                """,
                (marker, product_id),
            )
            sale = cur.fetchone()
            assert sale is not None
            assert sale[1] == 1

            cur.execute(
                'SELECT quantity FROM inventory WHERE branch_id = %s AND product_id = %s',
                (branch_id, product_id),
            )
            assert cur.fetchone()[0] == quantity - 1
        finally:
            conn.close()
    finally:
        conn = psycopg2.connect(DB_URL)
        try:
            cur = conn.cursor()
            cur.execute(
                'DELETE FROM sale_items si USING sales s '
                'WHERE si.sale_id = s.sale_id AND s.notes = %s',
                (marker,),
            )
            cur.execute('DELETE FROM sales WHERE notes = %s', (marker,))
            conn.commit()
        finally:
            conn.close()
        _restore_stock(branch_id, product_id, original_stock)
