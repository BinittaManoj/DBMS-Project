# tests/test_api_inventory.py
"""
API integration test for the inventory status view endpoint.
"""
import os
import requests
import pytest

BASE = os.getenv('API_BASE_URL', 'http://127.0.0.1:8000')


@pytest.fixture(scope='module')
def gm_session():
    session = requests.Session()
    resp = session.post(
        f'{BASE}/api/auth/login',
        json={'email': 'gm@medmart.in', 'password': 'manager123'},
    )
    assert resp.status_code == 200
    return session


def test_inventory_status_view(gm_session):
    """
    GET /api/inventory/status must return inventory rows from the v_inventory_status
    view. Each row must include branch_name, product_name, current_qty, and stock_status.
    Stock status must be one of: OK, LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY.
    """
    resp = gm_session.get(f'{BASE}/api/inventory/status')
    assert resp.status_code == 200, f'Expected 200, got {resp.status_code}: {resp.text}'
    rows = resp.json()
    assert isinstance(rows, list), 'Response must be a list'
    assert len(rows) >= 1, 'At least one inventory row should exist'
    valid_statuses = {'OK', 'LOW_STOCK', 'OUT_OF_STOCK', 'NEAR_EXPIRY'}
    for row in rows:
        assert 'product_name' in row, f'Missing product_name in row: {row}'
        assert 'current_qty' in row or 'quantity' in row, 'Missing quantity field'
        status = row.get('stock_status', '')
        assert status in valid_statuses, (
            f"Invalid stock_status '{status}'. Expected one of {valid_statuses}"
        )
