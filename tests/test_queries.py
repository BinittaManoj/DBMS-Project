import os

import psycopg2

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/retail_db')


def _run(sql: str):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    conn.close()
    return rows


def test_queries_run():
    sql = open('database/queries.sql', 'r', encoding='utf-8').read()
    assert 'SELECT' in sql
    # Smoke check: run a few likely queries.
    assert _run("SELECT COUNT(*) FROM sales")[0][0] >= 1
    assert _run("SELECT COUNT(*) FROM v_branch_sales_summary")[0][0] >= 1
