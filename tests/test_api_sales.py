# tests/test_api_sales.py
"""
API integration tests for sales processing and the branch summary report view.
"""
import os
import re
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


def test_create_sale_endpoint(gm_session):
    """
    POST /api/sales/process must create a sale via the process_sale stored procedure.
    Returns success=True with an invoice_no.
    """
    payload = {
        'branch_id': 1,
        'customer_id': None,
        'employee_id': 1,
        'payment_method': 'CASH',
        'discount': 0.0,
        'notes': 'Pytest test sale',
        'prescription_no': None,
        'items': [
            {'product_id': 1, 'quantity': 1, 'unit_price': 18.00, 'discount_pct': 0},
        ],
    }
    resp = gm_session.post(f'{BASE}/api/sales/process', json=payload)
    assert resp.status_code == 200, (
        f'Expected 200 from process_sale, got {resp.status_code}: {resp.text}'
    )
    data = resp.json()
    assert data.get('success') is True, f'Expected success=True, got: {data}'
    assert 'invoice_no' in data, 'Response must contain invoice_no'


def test_invoice_format(gm_session):
    """
    Invoice numbers must match the pattern INV-YYYYMMDD-XXXX.
    Create a sale and verify the returned invoice_no matches the regex.
    """
    payload = {
        'branch_id': 1,
        'customer_id': None,
        'employee_id': 1,
        'payment_method': 'UPI',
        'discount': 0.0,
        'notes': 'Invoice format test',
        'prescription_no': None,
        'items': [
            {'product_id': 2, 'quantity': 1, 'unit_price': 24.00, 'discount_pct': 0},
        ],
    }
    resp = gm_session.post(f'{BASE}/api/sales/process', json=payload)
    assert resp.status_code == 200
    data = resp.json()
    invoice_no = data.get('invoice_no', '')
    # Pattern: INV-YYYYMMDD-NNNN or INV-YYYYMMDD-NNNNN
    pattern = r'^INV-\d{8}-\d{4,5}$'
    assert re.match(pattern, invoice_no), (
        f"Invoice number '{invoice_no}' does not match pattern {pattern}"
    )


def test_branch_summary_view(gm_session):
    """
    GET /api/reports/branch-sales must return rows from v_branch_sales_summary.
    Each row must include branch_name, total_transactions, and total_revenue.
    At least one branch must have total_revenue > 0 (from sample data or test sales above).
    """
    resp = gm_session.get(f'{BASE}/api/reports/branch-sales')
    assert resp.status_code == 200, (
        f'Expected 200 from branch-sales report, got {resp.status_code}: {resp.text}'
    )
    data = resp.json()
    rows = data.get('rows', data) if isinstance(data, dict) else data
    assert isinstance(rows, list), 'Response must contain a list of rows'
    assert len(rows) >= 1, 'At least one branch row should exist'
    for row in rows:
        assert 'branch_name' in row, f'Missing branch_name in: {row}'
        assert 'total_revenue' in row, f'Missing total_revenue in: {row}'
    # At least one branch should have made some sales
    revenues = [float(r.get('total_revenue', 0)) for r in rows]
    assert max(revenues) > 0, 'Expected at least one branch with revenue > 0'
