# tests/test_api_branches.py
"""
API integration tests for the /api/branches endpoints.
"""
import os
import requests
import pytest

BASE = os.getenv('API_BASE_URL', 'http://127.0.0.1:8000')


@pytest.fixture(scope='module')
def auth_token():
    """Log in as the General Manager and return auth cookie jar."""
    session = requests.Session()
    resp = session.post(
        f'{BASE}/api/auth/login',
        json={'email': 'gm@medmart.in', 'password': 'manager123'},
    )
    assert resp.status_code == 200, f'Login failed: {resp.text}'
    return session


def test_get_branches(auth_token):
    """
    GET /api/branches/ must return a list of branch objects, each with branch_id
    and branch_name.
    """
    resp = auth_token.get(f'{BASE}/api/branches/')
    assert resp.status_code == 200, f'Expected 200, got {resp.status_code}: {resp.text}'
    data = resp.json()
    assert isinstance(data, list), 'Response must be a list'
    assert len(data) >= 1, 'At least one branch should exist'
    # Each branch must have basic required fields
    for branch in data:
        assert 'branch_id' in branch, 'Missing branch_id'
        assert 'branch_name' in branch, 'Missing branch_name'


def test_create_branch(auth_token):
    """
    POST /api/branches/ must create a new branch and return 201.
    The branch_name must appear in the response.
    """
    import uuid
    bname = f'MedMart Test Branch {uuid.uuid4().hex[:6]}'
    payload = {
        'branch_name': bname,
        'address': '123 Test Street',
        'city': 'Mumbai',
        'phone': '9800099999',
        'email': 'testbranch@medmart.in',
        'manager_name': 'Test Manager',
        'is_active': True,
    }
    resp = auth_token.post(f'{BASE}/api/branches/', json=payload)
    assert resp.status_code in (200, 201), (
        f'Expected 200 or 201, got {resp.status_code}: {resp.text}'
    )
    data = resp.json()
    assert data.get('branch_name') == bname, (
        f'branch_name mismatch in response: {data}'
    )
