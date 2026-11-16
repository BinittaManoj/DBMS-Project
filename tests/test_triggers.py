import os

import psycopg2

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/retail_db')


def test_low_stock_alert_table_exists():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'low_stock_alerts'")
    assert cur.fetchone()[0] > 0
    conn.close()
