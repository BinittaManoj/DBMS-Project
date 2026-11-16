# MedMart Retail Inventory & Sales Analytics System

This project is a complete PostgreSQL-backed retail inventory and sales analytics application built for a 4-student DBMS group project. The application models a multi-branch pharmacy chain and includes database logic, a FastAPI backend, static frontend pages, and validation tests.

## Overview

- Database: PostgreSQL 15/16+
- Backend: Python, FastAPI, SQLAlchemy, Pydantic
- Frontend: HTML, CSS, Bootstrap 5, Chart.js, plain JavaScript
- Domain: MedMart Pharmacy Chain with 3 branches
- Core features: inventory tracking, sales processing, low-stock alerts, purchase orders, branch reports, dashboard analytics

## Project structure

- `database/` — schema, triggers, procedures, views, queries, sample data
- `backend/` — FastAPI app, database config, ORM models, CRUD, routers
- `frontend/` — static pages served by FastAPI
- `tests/` — database and API validation tests
- `setup.ps1` — bootstrap script for local environment setup
- `.env.example` — environment template

## PostgreSQL setup

1. Install PostgreSQL 15 or 16 and confirm `psql` is available on PATH.
2. Create a local PostgreSQL database named `retail_db`.
3. Set the connection string in `.env` (copy from `.env.example`).

Example PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

Update the line:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/retail_db
```

## Local installation

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
```

## Initialize database

```powershell
./setup.ps1
```

The script will:

- verify `psql` and Python
- create a virtual environment if missing
- install Python dependencies
- create `.env` from `.env.example` if required
- create the `retail_db` database if it does not exist
- run the SQL scripts in order:
  - `database/schema.sql`
  - `database/triggers.sql`
  - `database/procedures.sql`
  - `database/views.sql`
  - `database/sample_data.sql`

## Run backend

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Open Swagger at:

```text
http://127.0.0.1:8000/docs
```

## Open frontend

The frontend pages are served from FastAPI static files. Open any page from the app root:

```text
http://127.0.0.1:8000/index.html
```

Available pages:

- `index.html` — dashboard
- `branches.html`
- `products.html`
- `suppliers.html`
- `customers.html`
- `inventory.html`
- `sales.html`

## Database design summary

The database includes the following main tables:

- `branches`
- `categories`
- `suppliers`
- `products`
- `customers`
- `employees`
- `inventory`
- `sales`
- `sale_items`
- `purchase_orders`
- `purchase_order_items`
- `low_stock_alerts`

### Key rules

- Inventory has one row per `(branch_id, product_id)`.
- `NUMERIC(12,2)` is used for all monetary values.
- Invoice numbers follow the `INV-YYYYMMDD-0001` pattern.
- Product sales decrement stock only through the trigger on `sale_items` insert.
- Low-stock alerts are inserted only when inventory crosses below reorder level.

## Trigger and procedure behavior

### Trigger 1: stock reduction

`trg_sale_items_reduce_stock` decrements inventory after each sale item insert. This is the only place stock is decreased.

### Trigger 2: low-stock alert

`trg_low_stock_alert` inserts an alert only when quantity transitions from at/above reorder level to below it.

### Procedure 1: `process_sale`

- locks inventory rows with `SELECT ... FOR UPDATE`
- validates required stock
- inserts sale header and items
- triggers stock reduction automatically
- rolls back on failure

### Procedure 2: `restock_inventory`

- validates branch, product, and purchase order
- updates or inserts inventory row
- optionally links to a purchase order receipt

## Views

- `v_branch_sales_summary` — transaction count and revenue by branch
- `v_inventory_status` — stock, reorder level, and reorder recommendation

## Queries

The SQL file `database/queries.sql` contains a mix of:

- simple queries
- nested queries
- set operations
- group by / having queries
- like / between filters
- correlated subqueries
- `EXISTS` and `NOT EXISTS`
- aggregate queries

## Testing

```powershell
.\.venv\Scripts\Activate.ps1
pytest tests -v
```

## Git workflow

This repo is prepared for a 4-student team workflow. See `CONTRIBUTING.md`.

## Viva notes

See `VIVA_NOTES.md` for normalization, functional dependency reasoning, 3NF justification, and likely viva questions with answers.

## Checklist

See `CHECKLIST.md` for the requirements mapping and validation status.

## Notes

The project intentionally uses real PostgreSQL operations and avoids `Base.metadata.create_all()`. The SQLAlchemy ORM models map to the existing database objects.
