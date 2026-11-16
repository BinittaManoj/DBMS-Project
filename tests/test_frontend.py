from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_index_page():
    response = client.get('/index.html')
    assert response.status_code == 200


def test_health():
    response = client.get('/health')
    assert response.status_code == 200
