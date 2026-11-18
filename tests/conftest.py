# tests/conftest.py
import os
import pytest
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:root@localhost:5432/retail_db')


@pytest.fixture(scope='session')
def db_conn():
    """Session-scoped database connection for all tests."""
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    yield conn
    conn.close()


@pytest.fixture
def db_cursor(db_conn):
    """Function-scoped cursor that always rolls back after each test."""
    cur = db_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    yield cur
    db_conn.rollback()  # Always rollback so tests don't pollute data
    cur.close()


@pytest.fixture
def raw_cursor(db_conn):
    """Function-scoped plain cursor."""
    cur = db_conn.cursor()
    yield cur
    db_conn.rollback()
    cur.close()
