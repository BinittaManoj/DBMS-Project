import os

import psycopg2

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/retail_db')


def test_tables_exist():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
    tables = {row[0] for row in cur.fetchall()}
    required = {
        'branches','categories','suppliers','products','customers','employees','inventory','sales','sale_items',
        'purchase_orders','purchase_order_items','low_stock_alerts'
    }
    assert required.issubset(tables)
    conn.close()
