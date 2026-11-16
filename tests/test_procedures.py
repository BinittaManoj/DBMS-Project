import os

import psycopg2

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/retail_db')


def test_procedure_exists():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' AND routine_name IN ('process_sale','restock_inventory') ORDER BY routine_name")
    names = {row[0] for row in cur.fetchall()}
    assert {'process_sale', 'restock_inventory'}.issubset(names)
    conn.close()
