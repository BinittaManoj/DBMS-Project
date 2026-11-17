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


def test_process_sale_rejects_duplicate_product_lines():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    try:
        cur.execute(
            """
            CALL process_sale(
                %s, %s, %s, %s, %s, %s, %s,
                %s::jsonb
            )
            """,
            (
                1,
                None,
                2,
                'CASH',
                0,
                None,
                None,
                '[{"product_id":1,"quantity":1,"unit_price":18},'
                '{"product_id":1,"quantity":2,"unit_price":18}]',
            ),
        )
        raise AssertionError('Duplicate product lines should be rejected')
    except psycopg2.Error as exc:
        assert 'Each product may appear only once per sale' in str(exc)
    finally:
        conn.rollback()
        cur.close()
        conn.close()
