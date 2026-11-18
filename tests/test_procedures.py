from concurrent.futures import ThreadPoolExecutor
from threading import Event
from time import monotonic, sleep
import os
from uuid import uuid4

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


def test_process_sale_locks_stock_per_branch_and_prevents_overselling():
    token = uuid4().hex
    sale_markers = [f'concurrency-test-{token}-a', f'concurrency-test-{token}-b']
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    branch_ids = []
    employee_ids = []
    product_id = None
    executor = ThreadPoolExecutor(max_workers=2)

    def create_branch(branch_number):
        cur.execute(
            """
            INSERT INTO branches (branch_name, address, city, phone)
            VALUES (%s, %s, %s, %s)
            RETURNING branch_id
            """,
            (
                f'Concurrency {token[:10]} {branch_number}',
                'Concurrency test',
                'Test City',
                f'{token[:10]}{branch_number}',
            ),
        )
        branch_id = cur.fetchone()[0]
        branch_ids.append(branch_id)
        cur.execute(
            """
            INSERT INTO employees (branch_id, first_name, last_name, role, phone, hire_date)
            VALUES (%s, 'Test', 'Cashier', 'CASHIER', %s, CURRENT_DATE)
            RETURNING employee_id
            """,
            (branch_id, f'{token[:12]}{branch_number}'),
        )
        employee_ids.append(cur.fetchone()[0])

    def sell(branch_id, employee_id, marker, pid_ready=None):
        worker_conn = psycopg2.connect(DB_URL)
        worker_cur = worker_conn.cursor()
        try:
            if pid_ready is not None:
                worker_cur.execute('SELECT pg_backend_pid()')
                pid_ready.append(worker_cur.fetchone()[0])
                pid_ready.event.set()
            worker_cur.execute(
                """
                CALL process_sale(
                    %s, NULL, %s, 'CASH', 0, %s, NULL,
                    %s::jsonb
                )
                """,
                (
                    branch_id,
                    employee_id,
                    marker,
                    f'[{{"product_id":{product_id},"quantity":1,"unit_price":1,"discount_pct":0}}]',
                ),
            )
            worker_conn.commit()
            return None
        except psycopg2.Error as exc:
            worker_conn.rollback()
            return str(exc)
        finally:
            worker_cur.close()
            worker_conn.close()

    class WorkerPid(list):
        def __init__(self):
            super().__init__()
            self.event = Event()

    try:
        for branch_number in (1, 2):
            create_branch(branch_number)
        cur.execute('SELECT category_id FROM categories ORDER BY category_id LIMIT 1')
        category_id = cur.fetchone()[0]
        cur.execute('SELECT supplier_id FROM suppliers ORDER BY supplier_id LIMIT 1')
        supplier_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO products (
                product_name, brand, category_id, supplier_id, unit_price, cost_price
            )
            VALUES (%s, 'Concurrency Test', %s, %s, 1, 1)
            RETURNING product_id
            """,
            (f'Concurrency probe {token}', category_id, supplier_id),
        )
        product_id = cur.fetchone()[0]
        for branch_id in branch_ids:
            cur.execute(
                """
                INSERT INTO inventory (branch_id, product_id, quantity, reorder_level)
                VALUES (%s, %s, 1, 0)
                """,
                (branch_id, product_id),
            )
        conn.commit()

        # Keep the first branch's row lock open while testing another branch.
        cur.execute(
            """
            CALL process_sale(
                %s, NULL, %s, 'CASH', 0, %s, NULL,
                %s::jsonb
            )
            """,
            (
                branch_ids[0],
                employee_ids[0],
                sale_markers[0],
                f'[{{"product_id":{product_id},"quantity":1,"unit_price":1,"discount_pct":0}}]',
            ),
        )
        other_branch_sale = executor.submit(
            sell, branch_ids[1], employee_ids[1], sale_markers[1]
        )
        assert other_branch_sale.result(timeout=5) is None

        # A second sale at the locked branch must wait, then see the committed zero stock.
        pid_ready = WorkerPid()
        competing_sale = executor.submit(
            sell, branch_ids[0], employee_ids[0], sale_markers[1], pid_ready
        )
        assert pid_ready.event.wait(timeout=5)
        monitor = psycopg2.connect(DB_URL)
        monitor_cur = monitor.cursor()
        try:
            deadline = monotonic() + 5
            waiting_on_row_lock = False
            while monotonic() < deadline and not competing_sale.done():
                monitor_cur.execute(
                    'SELECT wait_event_type FROM pg_stat_activity WHERE pid = %s',
                    (pid_ready[0],),
                )
                row = monitor_cur.fetchone()
                if row and row[0] == 'Lock':
                    waiting_on_row_lock = True
                    break
                sleep(0.02)
            assert waiting_on_row_lock
        finally:
            monitor_cur.close()
            monitor.close()

        conn.commit()
        failure = competing_sale.result(timeout=5)
        assert failure is not None
        assert 'Insufficient stock' in failure
    finally:
        if conn and not conn.closed:
            conn.rollback()
        executor.shutdown(wait=True, cancel_futures=True)

        cleanup = psycopg2.connect(DB_URL)
        cleanup_cur = cleanup.cursor()
        try:
            if sale_markers:
                cleanup_cur.execute(
                    'DELETE FROM sale_items si USING sales s '
                    'WHERE si.sale_id = s.sale_id AND s.notes = ANY(%s)',
                    (sale_markers,),
                )
                cleanup_cur.execute('DELETE FROM sales WHERE notes = ANY(%s)', (sale_markers,))
            if branch_ids:
                cleanup_cur.execute(
                    'DELETE FROM low_stock_alerts WHERE branch_id = ANY(%s)',
                    (branch_ids,),
                )
                cleanup_cur.execute('DELETE FROM inventory WHERE branch_id = ANY(%s)', (branch_ids,))
                cleanup_cur.execute('DELETE FROM employees WHERE branch_id = ANY(%s)', (branch_ids,))
            if product_id is not None:
                cleanup_cur.execute('DELETE FROM products WHERE product_id = %s', (product_id,))
            if branch_ids:
                cleanup_cur.execute('DELETE FROM branches WHERE branch_id = ANY(%s)', (branch_ids,))
            cleanup.commit()
        finally:
            cleanup_cur.close()
            cleanup.close()
        cur.close()
        conn.close()
