import os

import psycopg2

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/retail_db')


def test_views_exist():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.views WHERE table_schema = 'public' ORDER BY table_name")
    names = {row[0] for row in cur.fetchall()}
    assert {'v_branch_sales_summary', 'v_inventory_status'}.issubset(names)
    conn.close()
