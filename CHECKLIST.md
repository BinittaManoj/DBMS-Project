# Requirements checklist

This checklist maps the project requirements to implementation files and validation status.

## Database layer

- Schema with 12 tables and 3NF design — `database/schema.sql` — Status: implemented
- Triggers for stock decrement and low-stock alert — `database/triggers.sql` — Status: implemented
- Procedures for sales and restocking — `database/procedures.sql` — Status: implemented
- Views for branch sales and inventory status — `database/views.sql` — Status: implemented
- Sample data for branches, products, sales, PO items — `database/sample_data.sql` — Status: implemented
- Query file with required SQL patterns — `database/queries.sql` — Status: implemented

## Backend

- FastAPI app and route registration — `backend/main.py` — Status: implemented
- SQLAlchemy engine and session dependency — `backend/database.py` — Status: implemented
- ORM models mapping to DB tables — `backend/models.py` — Status: implemented
- Pydantic schemas — `backend/schemas.py` — Status: implemented
- CRUD routines — `backend/crud.py` — Status: implemented
- Router modules — `backend/routers/` — Status: implemented
- Requirements file — `backend/requirements.txt` — Status: implemented

## Frontend

- Dashboard page — `frontend/index.html` — Status: implemented
- Branch management page — `frontend/branches.html` — Status: implemented
- Product management page — `frontend/products.html` — Status: implemented
- Supplier page — `frontend/suppliers.html` — Status: implemented
- Customer page — `frontend/customers.html` — Status: implemented
- Inventory page — `frontend/inventory.html` — Status: implemented
- Sales and billing page — `frontend/sales.html` — Status: implemented
- Shared styles — `frontend/css/style.css` — Status: implemented
- Frontend API logic — `frontend/js/` — Status: implemented

## Setup and docs

- Setup automation script — `setup.ps1` — Status: implemented
- README — `README.md` — Status: implemented
- Viva notes — `VIVA_NOTES.md` — Status: implemented
- Team workflow — `CONTRIBUTING.md` — Status: implemented
- Environment template — `.env.example` — Status: implemented
- Git ignore — `.gitignore` — Status: implemented

## Validation evidence

The project includes test scripts under `tests/` and the SQL files are ready for validation. This environment currently has PostgreSQL installed but the local role/password for `postgres` is not configured in the current machine state; therefore a live database login was not available during this session. The validation commands are prepared and will run once a valid password is set in `.env` or in the PostgreSQL local user configuration.

## Final result

The repository is ready for a local DB-backed run once the PostgreSQL password is configured and `setup.ps1` is executed.
