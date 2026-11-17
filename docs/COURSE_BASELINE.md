# Multi-Branch Retail Inventory & Sales Analytics System

Complete SQL Deliverable — mapped to course requirements

Written for PostgreSQL (INTERSECT/EXCEPT need PostgreSQL or MySQL 8.0.31+; noted where it matters).

## 1. Schema — 8 Tables, PK + FK, 5+ attributes each

```sql
CREATE TABLE branch (
    branch_id     INT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    city          VARCHAR(100),
    address       VARCHAR(200),
    phone         VARCHAR(20),
    manager_name  VARCHAR(100)
);

CREATE TABLE supplier (
    supplier_id   INT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20),
    email         VARCHAR(100),
    address       VARCHAR(200),
    rating        DECIMAL(2,1) DEFAULT 3.0
);

CREATE TABLE product (
    product_id    INT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    category      VARCHAR(50),
    price         DECIMAL(10,2) NOT NULL,
    supplier_id   INT,
    reorder_level INT DEFAULT 10,
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id)
);

CREATE TABLE customer (
    customer_id    INT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    phone          VARCHAR(20),
    email          VARCHAR(100),
    city           VARCHAR(100),
    loyalty_points INT DEFAULT 0
);

CREATE TABLE inventory (
    branch_id        INT,
    product_id       INT,
    quantity         INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reorder_level     INT DEFAULT 10,
    last_restock_date DATE,
    version          INT NOT NULL DEFAULT 0,
    PRIMARY KEY (branch_id, product_id),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id)
);

CREATE TABLE sale (
    sale_id       INT PRIMARY KEY,
    branch_id     INT NOT NULL,
    customer_id   INT,
    sale_date     DATE DEFAULT CURRENT_DATE,
    payment_mode  VARCHAR(20),
    total_amount  DECIMAL(10,2),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

CREATE TABLE sale_item (
    sale_id     INT,
    product_id  INT,
    quantity    INT NOT NULL CHECK (quantity > 0),
    unit_price  DECIMAL(10,2) NOT NULL,
    discount    DECIMAL(5,2) DEFAULT 0,
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id)
);

CREATE TABLE purchase_order (
    po_id             INT PRIMARY KEY,
    supplier_id       INT NOT NULL,
    product_id        INT NOT NULL,
    branch_id         INT NOT NULL,
    order_date        DATE DEFAULT CURRENT_DATE,
    quantity_ordered  INT NOT NULL,
    status            VARCHAR(20) DEFAULT 'PENDING',
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id),
    FOREIGN KEY (product_id) REFERENCES product(product_id),
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
);
```

Table count: 8 (`branch`, `supplier`, `product`, `customer`, `inventory`, `sale`, `sale_item`, `purchase_order`) — clears the minimum of 6, and `inventory` / `sale_item` are junction tables with composite PKs, which is worth a line in your report as a design decision.

## 2. Simple Queries (5)

```sql
-- 1. Products priced above 500
SELECT * FROM product WHERE price > 500;

-- 2. Customers from a specific city
SELECT * FROM customer WHERE city = 'Chennai';

-- 3. All sales made at a specific branch
SELECT * FROM sale WHERE branch_id = 1;

-- 4. Suppliers with rating 4 or above
SELECT * FROM supplier WHERE rating >= 4;

-- 5. Inventory records below reorder level
SELECT * FROM inventory WHERE quantity < reorder_level;
```

## 3. Nested Queries (5)

```sql
-- 1. Products priced above the overall average price
SELECT name, price FROM product
WHERE price > (SELECT AVG(price) FROM product);

-- 2. Customers who have never made a purchase
SELECT * FROM customer
WHERE customer_id NOT IN (SELECT customer_id FROM sale WHERE customer_id IS NOT NULL);

-- 3. Branch(es) with the highest total revenue
SELECT branch_id, total_amount FROM sale
WHERE total_amount = (SELECT MAX(total_amount) FROM sale);

-- 4. Suppliers who supply the single most expensive product
SELECT name FROM supplier
WHERE supplier_id = (SELECT supplier_id FROM product ORDER BY price DESC LIMIT 1);

-- 5. Products that have never appeared in any sale
SELECT * FROM product
WHERE product_id NOT IN (SELECT product_id FROM sale_item);
```

## 4. SET Operations (2 — one UNION, one INTERSECT)

```sql
-- UNION: all cities that have either a branch or a customer
SELECT city FROM branch
UNION
SELECT city FROM customer;

-- INTERSECT: cities that have BOTH a branch and a customer
-- (MySQL < 8.0.31: replace with a WHERE ... IN subquery instead)
SELECT city FROM branch
INTERSECT
SELECT city FROM customer;
```

## 5. GROUP BY (2)

```sql
-- 1. Total revenue per branch
SELECT branch_id, SUM(total_amount) AS total_revenue
FROM sale
GROUP BY branch_id;

-- 2. Total quantity sold per product
SELECT product_id, SUM(quantity) AS total_qty_sold
FROM sale_item
GROUP BY product_id;
```

## 6. HAVING (2)

```sql
-- 1. Branches whose total revenue exceeds 50,000
SELECT branch_id, SUM(total_amount) AS total_revenue
FROM sale
GROUP BY branch_id
HAVING SUM(total_amount) > 50000;

-- 2. Products sold more than 20 times in total
SELECT product_id, SUM(quantity) AS total_qty
FROM sale_item
GROUP BY product_id
HAVING SUM(quantity) > 20;
```

## 7. Pattern Matching — LIKE / BETWEEN (3)

```sql
-- 1. LIKE: products whose name starts with 'A'
SELECT * FROM product WHERE name LIKE 'A%';

-- 2. LIKE: customers whose email is a gmail address
SELECT * FROM customer WHERE email LIKE '%@gmail.com';

-- 3. BETWEEN: products priced between 100 and 1000
SELECT * FROM product WHERE price BETWEEN 100 AND 1000;
```

## 8. Correlated Query (1)

```sql
-- Products priced above the average price of products from the SAME supplier
SELECT p1.name, p1.price, p1.supplier_id
FROM product p1
WHERE p1.price > (
    SELECT AVG(p2.price)
    FROM product p2
    WHERE p2.supplier_id = p1.supplier_id
);
```

This is correlated because the inner query references `p1.supplier_id` from the outer query — it re-runs once per outer row, unlike the nested queries in section 3 which run once total.

## 9. Views (2)

```sql
-- 1. Branch-wise sales summary
CREATE VIEW branch_sales_summary AS
SELECT b.branch_id, b.name AS branch_name, SUM(s.total_amount) AS total_revenue, COUNT(s.sale_id) AS num_sales
FROM branch b
JOIN sale s ON b.branch_id = s.branch_id
GROUP BY b.branch_id, b.name;

-- 2. Low-stock products across all branches
CREATE VIEW low_stock_products AS
SELECT i.branch_id, p.name AS product_name, i.quantity, i.reorder_level
FROM inventory i
JOIN product p ON i.product_id = p.product_id
WHERE i.quantity < i.reorder_level;
```

## 10. EXISTS / NOT EXISTS (2)

```sql
-- 1. EXISTS: customers who have placed at least one sale
SELECT * FROM customer c
WHERE EXISTS (SELECT 1 FROM sale s WHERE s.customer_id = c.customer_id);

-- 2. NOT EXISTS: products that have never been ordered from any supplier
SELECT * FROM product p
WHERE NOT EXISTS (SELECT 1 FROM purchase_order po WHERE po.product_id = p.product_id);
```

## 11. Aggregate Functions (4)

```sql
-- COUNT: number of customers per city
SELECT city, COUNT(*) AS customer_count FROM customer GROUP BY city;

-- SUM: total revenue across all branches
SELECT SUM(total_amount) AS grand_total_revenue FROM sale;

-- AVG: average product price by category
SELECT category, AVG(price) AS avg_price FROM product GROUP BY category;

-- MAX / MIN: highest and lowest priced product
SELECT MAX(price) AS highest_price, MIN(price) AS lowest_price FROM product;
```

## 12. Triggers (2)

```sql
-- 1. Auto-decrement inventory after a sale_item is inserted
CREATE OR REPLACE FUNCTION fn_decrement_stock() RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory
    SET quantity = quantity - NEW.quantity
    WHERE product_id = NEW.product_id
      AND branch_id = (SELECT branch_id FROM sale WHERE sale_id = NEW.sale_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_stock
AFTER INSERT ON sale_item
FOR EACH ROW EXECUTE FUNCTION fn_decrement_stock();

-- 2. Auto-log a purchase order when stock drops below reorder level
CREATE OR REPLACE FUNCTION fn_auto_reorder() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity < NEW.reorder_level THEN
        INSERT INTO purchase_order (po_id, supplier_id, product_id, branch_id, quantity_ordered, status)
        VALUES (
            (SELECT COALESCE(MAX(po_id), 0) + 1 FROM purchase_order),
            (SELECT supplier_id FROM product WHERE product_id = NEW.product_id),
            NEW.product_id, NEW.branch_id,
            NEW.reorder_level * 2, 'PENDING'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_reorder
AFTER UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION fn_auto_reorder();
```

## 13. Stored Procedures (2)

```sql
-- 1. Process a full sale transaction: insert sale + item, decrement stock, atomically
CREATE OR REPLACE PROCEDURE sp_process_sale(
    p_sale_id INT, p_branch_id INT, p_customer_id INT,
    p_product_id INT, p_qty INT, p_unit_price DECIMAL
)
LANGUAGE plpgsql AS $$
DECLARE
    current_stock INT;
BEGIN
    SELECT quantity INTO current_stock
    FROM inventory
    WHERE branch_id = p_branch_id AND product_id = p_product_id
    FOR UPDATE;

    IF current_stock IS NULL OR current_stock < p_qty THEN
        RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
    END IF;

    INSERT INTO sale (sale_id, branch_id, customer_id, total_amount)
    VALUES (p_sale_id, p_branch_id, p_customer_id, p_qty * p_unit_price);

    INSERT INTO sale_item (sale_id, product_id, quantity, unit_price)
    VALUES (p_sale_id, p_product_id, p_qty, p_unit_price);

    UPDATE inventory
    SET quantity = quantity - p_qty
    WHERE branch_id = p_branch_id AND product_id = p_product_id;

    COMMIT;
END;
$$;

-- Call it:
-- CALL sp_process_sale(101, 1, 5, 20, 2, 499.00);

-- 2. Generate reorder recommendations based on sales velocity
CREATE OR REPLACE PROCEDURE sp_generate_reorder_list()
LANGUAGE plpgsql AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT i.branch_id, i.product_id, i.quantity, p.supplier_id
        FROM inventory i
        JOIN product p ON i.product_id = p.product_id
        WHERE i.quantity < i.reorder_level
    LOOP
        INSERT INTO purchase_order (po_id, supplier_id, product_id, branch_id, quantity_ordered, status)
        VALUES (
            (SELECT COALESCE(MAX(po_id), 0) + 1 FROM purchase_order),
            rec.supplier_id, rec.product_id, rec.branch_id,
            50, 'PENDING'
        );
    END LOOP;
END;
$$;

-- Call it:
-- CALL sp_generate_reorder_list();
```

## 14. Frontend — 5 Forms

Build against whatever stack you're comfortable with (even a simple web app or desktop GUI is fine — the grading is usually on the queries working, not the UI framework). Minimum forms:

- **Main Menu** — navigation to all other forms/reports
- **Data Entry Form** — add new Product / Customer / Supplier (a tabbed or dropdown-selected entry form covers this in one screen)
- **Sale Entry Form** — the transactional one: select branch, customer, add products with quantity, calls `sp_process_sale`
- **Retrieval / Search Form** — search products by name (`LIKE`), filter by price range (`BETWEEN`), filter by branch/city
- **Update Form** — edit stock quantity, update customer details, update product price

Keep each form thin — it should just collect input and call the matching query/procedure above, not contain business logic itself.

## 15. Reports (2)

- **Branch Sales Report** — pulls from `branch_sales_summary` view; shows revenue and sale count per branch, filterable by date range
- **Low Stock / Reorder Report** — pulls from `low_stock_products` view; shows every product below reorder level, with the linked supplier for quick action

## Coverage checklist

| Requirement | Count required | Covered |
|---|---:|---:|
| Tables (PK+FK, 5+ attrs) | 6 min | 8 |
| Simple queries | 5 | 5 |
| Nested queries | 5 | 5 |
| SET operations | 2 | 2 |
| GROUP BY | 2 | 2 |
| HAVING | 2 | 2 |
| LIKE/BETWEEN | 3 | 3 |
| Correlated query | 1 | 1 |
| Views | 2 | 2 |
| EXISTS/NOT EXISTS | 2 | 2 |
| Aggregate functions | 4 | 4 |
| Triggers | 2 | 2 |
| Stored procedures | 2 | 2 |
| Frontend forms | 5 min | 5 |
| Reports | 2 | 2 |
