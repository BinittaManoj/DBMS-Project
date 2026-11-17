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


def test_inventory_and_sale_items_use_composite_primary_keys():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("""
        SELECT tc.table_name, array_agg(kcu.column_name::text ORDER BY kcu.ordinal_position)
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
         AND tc.table_name = kcu.table_name
        WHERE tc.table_schema = 'public'
          AND tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name IN ('inventory', 'sale_items')
        GROUP BY tc.table_name
    """)
    primary_keys = {table: columns for table, columns in cur.fetchall()}
    assert primary_keys == {
        'inventory': ['branch_id', 'product_id'],
        'sale_items': ['sale_id', 'product_id'],
    }

    cur.execute("""
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'inventory'::regclass
          AND contype = 'c'
    """)
    assert any('quantity >= 0' in definition for (definition,) in cur.fetchall())
    conn.close()
