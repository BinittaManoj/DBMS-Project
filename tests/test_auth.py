from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_login_success_and_me():
    response = client.post('/api/auth/login', json={'email': 'gm@medmart.in', 'password': 'manager123'})
    assert response.status_code == 200, response.text
    assert response.cookies.get('access_token')
    data = response.json()
    assert data['user']['role'] == 'GENERAL_MANAGER'

    me = client.get('/api/auth/me')
    assert me.status_code == 200, me.text
    assert me.json()['email'] == 'gm@medmart.in'


def test_branch_manager_login_and_403_for_other_branch():
    response = client.post('/api/auth/login', json={'email': 'branch1@medmart.in', 'password': 'branch123'})
    assert response.status_code == 200, response.text
    token = response.cookies.get('access_token')
    assert token

    branch_me = client.get('/api/auth/me')
    assert branch_me.status_code == 200
    assert branch_me.json()['branch_id'] == 1
