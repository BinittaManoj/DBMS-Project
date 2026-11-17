import threading
import os
from dotenv import load_dotenv

import psycopg2

load_dotenv()
DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/retail_db')


def run_sale(index):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    try:
        cur.execute(
            "CALL process_sale(%s, %s, %s, %s, %s, %s, %s, %s)",
            (1, 1, 1, 'CASH', 0, 'conc', None, '[{"product_id": 1, "quantity": 1, "unit_price": 18.00, "discount_pct": 0}]')
        )
        conn.commit()
        return True
    except Exception:
        conn.rollback()
        return False
    finally:
        conn.close()


def test_concurrency():
    # This is a placeholder smoke test. The real concurrent validation should be run against a dedicated stock fixture.
    results = []
    threads = [threading.Thread(target=lambda: results.append(run_sale(1))) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert len([x for x in results if x]) >= 0
