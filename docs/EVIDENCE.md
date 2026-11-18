# Verification evidence

## Phase 0: Environment and repo

### 0.1 Tools present — PASS

Command run in PowerShell:

```powershell
psql --version; python --version; node --version; npm --version; git --version
```

Output:

```text
psql (PostgreSQL) 17.9
Python 3.12.3
v24.13.1
11.6.4
git version 2.47.0.windows.2
```

### 0.2 Repository and ignore rules — PASS

Commands run in PowerShell:

```powershell
git --no-pager log --reverse --format="%h %s"
git ls-files --error-unmatch .gitignore
git --no-pager log --reverse --diff-filter=A --format="%h %s" -- .gitignore
git check-ignore -v .env .env.local backend\node_modules\check.js frontend-react\.next\check backend\uploads\check.bin
git check-ignore -v backend\uploads\.gitkeep
git --no-pager status --short
```

Output:

```text
7dad4b3 second commit
ebc1390 third commit
2d6870b docs: record environment validation
.gitignore
7dad4b3 second commit
.gitignore:19:.env .env
.gitignore:20:.env.local .env.local
.gitignore:23:node_modules/ backend\node_modules\check.js
.gitignore:24:.next/ frontend-react\.next\check
.gitignore:27:backend/uploads/* backend\uploads\check.bin
.gitignore:28:!backend/uploads/.gitkeep backend\uploads\.gitkeep (placeholder is not ignored)
```

The working tree also contains the in-progress application changes from this
task; they were left unstaged and untouched.

### 0.3 Project structure — PASS

PowerShell `Test-Path` verification:

```text
backend : True
frontend : True
database : True
docs : True
tests : True
.env.example : True
README.md : True
CONTRIBUTING.md : True
CHECKLIST.md : True
VIVA_NOTES.md : True
```

### 0.4 Original SQL baseline — PASS

Verification:

```text
baseline exists: True
baseline CREATE TABLE statements: 8
baseline sections: 16
```

The user-provided original SQL deliverable is preserved in
`docs/COURSE_BASELINE.md`.

### 0.5 Environment template secrets — PASS

Verification:

```text
DATABASE_URL= present
JWT_SECRET_KEY= present
JWT_ACCESS_TOKEN_EXPIRE_MINUTES= present
.env.example:5:DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/retail_db
No concrete database password or JWT secret found.
```

### Phase 0 regression pass — PASS

Re-ran checks 0.1–0.5 after completing the phase. The commands completed
successfully: all five tool versions were reported, `.gitignore` is tracked
from the first commit and excludes the required paths, all required folders
and files exist, the supplied baseline has eight table definitions, and the
environment template contains the expected keys with placeholder secrets.

### 1.1 Preserve baseline table names — ACCEPTED DEVIATION

Verification against `database/schema.sql` and the live `retail_db`:

```text
Current base tables:
branches, categories, customers, employees, inventory, low_stock_alerts,
products, purchase_order_items, purchase_orders, sale_items, sales, suppliers
Baseline singular names present: inventory
```

The current application uses plural table names throughout its ORM, SQL,
routers, and live database; the baseline requires eight singular names. On
the user's instruction to choose the direction necessary for the multi-branch
system, retain the established schema to avoid a coordinated, potentially
destructive rename. Preserve the baseline entities through this mapping:

```text
branch -> branches
supplier -> suppliers
product -> products
customer -> customers
inventory -> inventory
sale -> sales
sale_item -> sale_items
purchase_order -> purchase_orders
```

This is an intentional naming deviation, not a claim that the singular-name
check passed.

### 1.2 Identity keys — PASS

Live database verification returned 12 identity columns; every primary key
column is an identity column, and the query found no primary-key fields
without identity generation. The schema declarations use
`GENERATED ALWAYS AS IDENTITY`; no `SERIAL` or `MAX(...)` ID allocator was
found in `database/schema.sql`.

### 1.3 Composite keys and inventory checks — PASS

The migration was applied transactionally to the live database; it preserved
the existing rows and added a duplicate-product-line guard to `process_sale`.
Verification:

```text
inventory primary key: branch_id, product_id
sale_items primary key: sale_id, product_id
inventory constraints: UNIQUE (branch_id, product_id); CHECK ((quantity >= 0)); CHECK ((reorder_level >= 0))
duplicate sale-item pairs: 0
Focused schema/procedure tests: 4 passed
Full test suite: 12 passed, 1 pre-existing deprecation warning
Frontend lint: passed
Frontend production build: passed
```

`sale_item_id` and `inventory_id` remain unique identity columns for API
compatibility. Each product can now appear only once in a sale; duplicate sale
lines are rejected with a clear database error.

### 1.4 Medicine catalog fields — PASS

Added a unique, generated `medicine_code` and optional `image_url` to the
product schema, ORM, API, catalog form, search, and medicine analytics.
Existing products were backfilled with stable codes. The migration was applied
transactionally to `retail_db` and reapplied to verify idempotency; the current
product codes are nonblank and unique.

Verification:

```text
Full backend suite: 14 passed, 1 pre-existing deprecation warning
Frontend lint: passed
Frontend production build: passed
Medicine analytics query: returned the medicine code and image_url field
Generated medicine-code default: verified inside a rolled-back test transaction
```

### Branch concurrency — PASS

The sale procedure locks only the matching `(branch_id, product_id)` inventory
row. This keeps competing sales for the same branch/product serialized without
blocking sales for the same medicine at other branches. The live database was
updated with migration `003_branch_scoped_sale_lock.sql`.

Verification:

```text
Active demo branches: MedMart Andheri, MedMart Dadar, MedMart Pune
Concurrency test: independent branch sale completed while another branch's
stock row was locked; a competing sale at the locked branch waited and was
rejected after stock reached zero
Procedure tests: 3 passed
```
