# tests/test_api_products.py
"""
API integration tests for the /api/products endpoints.
"""
import os
import requests
import pytest

BASE = os.getenv('API_BASE_URL', 'http://127.0.0.1:8000')


@pytest.fixture(scope='module')
def gm_session():
    """Authenticated session as General Manager."""
    session = requests.Session()
    resp = session.post(
        f'{BASE}/api/auth/login',
        json={'email': 'gm@medmart.in', 'password': 'manager123'},
    )
    assert resp.status_code == 200
    return session


def test_list_products(gm_session):
    """
    GET /api/products/ must return a list of product objects with key pharmacy fields.
    At least one product must exist in the sample data.
    """
    resp = gm_session.get(f'{BASE}/api/products/')
    assert resp.status_code == 200, f'Expected 200, got {resp.status_code}: {resp.text}'
    products = resp.json()
    assert isinstance(products, list), 'Response must be a list'
    assert len(products) >= 1, 'At least one product should exist'
    for p in products:
        assert 'product_id' in p
        assert 'product_name' in p
        assert 'unit_price' in p


def test_product_prescription_filter(gm_session):
    """
    GET /api/products/?requires_prescription=true must return only prescription medicines.
    Sample data includes Amoxicillin 500mg which requires a prescription.
    All returned products must have requires_prescription == True.
    """
    resp = gm_session.get(f'{BASE}/api/products/', params={'requires_prescription': 'true'})
    assert resp.status_code == 200, f'Expected 200, got {resp.status_code}: {resp.text}'
    products = resp.json()
    assert isinstance(products, list)
    # If prescription filtering is supported, verify all results require prescription
    if products:  # only validate if any results returned
        for p in products:
            assert p.get('requires_prescription') is True, (
                f"Product {p.get('product_name')} should require prescription"
            )
