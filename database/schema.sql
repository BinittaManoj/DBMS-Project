-- =============================================================================
-- MedMart Pharmacy Chain -- Retail Inventory & Sales Analytics System
-- schema.sql  |  PostgreSQL 17  |  Database: retail_db
-- Run order: schema.sql -> triggers.sql -> procedures.sql -> views.sql -> sample_data.sql
-- =============================================================================

-- Drop all tables in reverse dependency order (safe to re-run)
DROP TABLE IF EXISTS low_stock_alerts       CASCADE;
DROP TABLE IF EXISTS purchase_order_items   CASCADE;
DROP TABLE IF EXISTS purchase_orders        CASCADE;
DROP TABLE IF EXISTS sale_items             CASCADE;
DROP TABLE IF EXISTS sales                  CASCADE;
DROP TABLE IF EXISTS inventory              CASCADE;
DROP TABLE IF EXISTS employees              CASCADE;
DROP TABLE IF EXISTS customers              CASCADE;
DROP TABLE IF EXISTS products               CASCADE;
DROP TABLE IF EXISTS suppliers              CASCADE;
DROP TABLE IF EXISTS categories             CASCADE;
DROP TABLE IF EXISTS branches               CASCADE;
DROP SEQUENCE IF EXISTS invoice_seq;

-- =============================================================================
-- 1. BRANCHES
-- =============================================================================
CREATE TABLE branches (
    branch_id    INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_name  VARCHAR(100) NOT NULL UNIQUE,
    address      TEXT         NOT NULL,
    city         VARCHAR(50)  NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(100),
    manager_name VARCHAR(100),
    gstin        VARCHAR(20),                          -- GST number for Indian pharma
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_branches_city ON branches(city);

-- =============================================================================
-- 2. CATEGORIES
-- =============================================================================
CREATE TABLE categories (
    category_id   INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. SUPPLIERS
-- =============================================================================
CREATE TABLE suppliers (
    supplier_id    INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_name  VARCHAR(150) NOT NULL UNIQUE,
    contact_person VARCHAR(100),
    phone          VARCHAR(20)  NOT NULL,
    email          VARCHAR(100),
    address        TEXT,
    city           VARCHAR(50),
    gstin          VARCHAR(20),
    license_no     VARCHAR(50),                        -- Drug license number
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suppliers_name ON suppliers(supplier_name);

-- =============================================================================
-- 4. PRODUCTS  (pharmacy-specific: expiry tracking, drug schedule, HSN code)
-- =============================================================================
CREATE TABLE products (
    product_id           INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_name         VARCHAR(200)   NOT NULL,
    brand                VARCHAR(100),
    category_id          INTEGER        NOT NULL REFERENCES categories(category_id),
    supplier_id          INTEGER        NOT NULL REFERENCES suppliers(supplier_id),
    unit_price           NUMERIC(12,2)  NOT NULL CHECK (unit_price > 0),
    cost_price           NUMERIC(12,2)  NOT NULL CHECK (cost_price > 0),
    unit_of_measure      VARCHAR(20)    NOT NULL DEFAULT 'STRIP',  -- STRIP, BOTTLE, TUBE, VIAL, SACHET
    requires_prescription BOOLEAN        NOT NULL DEFAULT FALSE,
    drug_schedule        VARCHAR(5)     DEFAULT 'OTC'              -- OTC, H, H1, X, G
                         CHECK (drug_schedule IN ('OTC','H','H1','X','G')),
    hsn_code             VARCHAR(10),                              -- Harmonized System Nomenclature
    shelf_life_days      INTEGER        CHECK (shelf_life_days > 0), -- default shelf life
    is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (product_name, brand)
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_name     ON products(product_name);
CREATE INDEX idx_products_active   ON products(is_active);

-- =============================================================================
-- 5. CUSTOMERS
-- =============================================================================
CREATE TABLE customers (
    customer_id    INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  NOT NULL UNIQUE,
    email          VARCHAR(100),
    address        TEXT,
    city           VARCHAR(50),
    date_of_birth  DATE,
    loyalty_points INTEGER      NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name  ON customers(last_name, first_name);

-- =============================================================================
-- 6. EMPLOYEES
-- =============================================================================
CREATE TABLE employees (
    employee_id INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id   INTEGER        NOT NULL REFERENCES branches(branch_id),
    first_name  VARCHAR(100)   NOT NULL,
    last_name   VARCHAR(100)   NOT NULL,
    role        VARCHAR(30)    NOT NULL
                CHECK (role IN ('PHARMACIST','CASHIER','MANAGER','INVENTORY_STAFF')),
    phone       VARCHAR(20)    NOT NULL,
    email       VARCHAR(100),
    hire_date   DATE           NOT NULL DEFAULT CURRENT_DATE,
    salary      NUMERIC(12,2)  CHECK (salary > 0),
    is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_employees_branch ON employees(branch_id);

-- =============================================================================
-- 7. INVENTORY  (one row per branch+product; pharmacy adds batch & expiry)
-- =============================================================================
CREATE TABLE inventory (
    inventory_id      INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id         INTEGER       NOT NULL REFERENCES branches(branch_id),
    product_id        INTEGER       NOT NULL REFERENCES products(product_id),
    quantity          INTEGER       NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level     INTEGER       NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    batch_number      VARCHAR(50),                     -- current batch on shelf
    expiry_date       DATE,                            -- expiry of current batch
    manufacture_date  DATE,                            -- manufacture date of current batch
    last_restocked_at TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (branch_id, product_id)
);
CREATE INDEX idx_inventory_branch  ON inventory(branch_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_expiry  ON inventory(expiry_date);

-- =============================================================================
-- 8. INVOICE SEQUENCE  (used by process_sale procedure)
-- =============================================================================
CREATE SEQUENCE invoice_seq START 1 INCREMENT 1;

-- =============================================================================
-- 9. SALES
-- =============================================================================
CREATE TABLE sales (
    sale_id        INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    invoice_no     VARCHAR(30)    NOT NULL UNIQUE,
    branch_id      INTEGER        NOT NULL REFERENCES branches(branch_id),
    customer_id    INTEGER        REFERENCES customers(customer_id),
    employee_id    INTEGER        NOT NULL REFERENCES employees(employee_id),
    sale_date      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    subtotal       NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount       NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (discount >= 0),
    tax_amount     NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount   NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_method VARCHAR(20)    NOT NULL DEFAULT 'CASH'
                   CHECK (payment_method IN ('CASH','CARD','UPI','INSURANCE')),
    prescription_no VARCHAR(50),                       -- for Schedule H drugs
    notes          TEXT,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sales_branch   ON sales(branch_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date     ON sales(sale_date);
CREATE INDEX idx_sales_invoice  ON sales(invoice_no);

-- =============================================================================
-- 10. SALE_ITEMS
-- =============================================================================
CREATE TABLE sale_items (
    sale_item_id INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sale_id      INTEGER        NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
    product_id   INTEGER        NOT NULL REFERENCES products(product_id),
    quantity     INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(12,2)  NOT NULL CHECK (unit_price > 0),
    discount_pct NUMERIC(5,2)   NOT NULL DEFAULT 0
                 CHECK (discount_pct >= 0 AND discount_pct <= 100),
    subtotal     NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sale_items_sale    ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

-- =============================================================================
-- 11. PURCHASE_ORDERS
-- =============================================================================
CREATE TABLE purchase_orders (
    po_id             INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    po_number         VARCHAR(30)    NOT NULL UNIQUE,
    branch_id         INTEGER        NOT NULL REFERENCES branches(branch_id),
    supplier_id       INTEGER        NOT NULL REFERENCES suppliers(supplier_id),
    employee_id       INTEGER        NOT NULL REFERENCES employees(employee_id),
    po_date           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    expected_delivery DATE,
    received_date     DATE,
    status            VARCHAR(20)    NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING','RECEIVED','PARTIAL','CANCELLED')),
    total_amount      NUMERIC(12,2)  DEFAULT 0 CHECK (total_amount >= 0),
    notes             TEXT,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_po_branch   ON purchase_orders(branch_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status   ON purchase_orders(status);

-- =============================================================================
-- 12. PURCHASE_ORDER_ITEMS
-- =============================================================================
CREATE TABLE purchase_order_items (
    po_item_id        INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    po_id             INTEGER        NOT NULL REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_id        INTEGER        NOT NULL REFERENCES products(product_id),
    quantity_ordered  INTEGER        NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INTEGER        NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost         NUMERIC(12,2)  NOT NULL CHECK (unit_cost > 0),
    batch_number      VARCHAR(50),                     -- batch being ordered
    expiry_date       DATE,                            -- expiry of this PO batch
    manufacture_date  DATE,
    subtotal          NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_poi_po      ON purchase_order_items(po_id);
CREATE INDEX idx_poi_product ON purchase_order_items(product_id);

-- =============================================================================
-- 13. LOW_STOCK_ALERTS
-- =============================================================================
CREATE TABLE low_stock_alerts (
    alert_id         INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    branch_id        INTEGER      NOT NULL REFERENCES branches(branch_id),
    product_id       INTEGER      NOT NULL REFERENCES products(product_id),
    current_quantity INTEGER      NOT NULL,
    reorder_level    INTEGER      NOT NULL,
    alert_type       VARCHAR(20)  NOT NULL DEFAULT 'LOW_STOCK'
                     CHECK (alert_type IN ('LOW_STOCK','OUT_OF_STOCK','NEAR_EXPIRY')),
    alert_message    TEXT,
    is_resolved      BOOLEAN      NOT NULL DEFAULT FALSE,
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alerts_branch    ON low_stock_alerts(branch_id);
CREATE INDEX idx_alerts_product   ON low_stock_alerts(product_id);
CREATE INDEX idx_alerts_resolved  ON low_stock_alerts(is_resolved);

-- =============================================================================
-- GRANT permissions (adjust role name if needed)
-- =============================================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO retail_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO retail_user;
