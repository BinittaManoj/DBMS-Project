-- =============================================================================
-- MedMart Pharmacy Chain -- Analytical & Reporting Queries
-- queries.sql  |  All queries run on the retail_db schema
-- =============================================================================

-- ============================================================
-- SECTION A: SIMPLE QUERIES (5)
-- ============================================================

-- A1. List all active products with their category and supplier
-- Purpose: Quick product catalog with supplier info
SELECT
    p.product_id,
    p.product_name,
    p.brand,
    c.category_name,
    s.supplier_name,
    p.unit_price,
    p.drug_schedule,
    p.unit_of_measure
FROM products p
JOIN categories c ON c.category_id = p.category_id
JOIN suppliers  s ON s.supplier_id = p.supplier_id
WHERE p.is_active = TRUE
ORDER BY c.category_name, p.product_name;

-- A2. List all employees per branch with their role
-- Purpose: HR overview per branch
SELECT
    b.branch_name,
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    e.role,
    e.hire_date,
    e.salary
FROM employees e
JOIN branches b ON b.branch_id = e.branch_id
WHERE e.is_active = TRUE
ORDER BY b.branch_name, e.role;

-- A3. Show current inventory with expiry info for a specific branch
-- Purpose: Branch manager's daily stock check
SELECT
    p.product_name,
    p.brand,
    i.quantity,
    i.reorder_level,
    i.batch_number,
    i.expiry_date,
    (i.expiry_date - CURRENT_DATE) AS days_to_expiry
FROM inventory i
JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 1
ORDER BY i.expiry_date ASC NULLS LAST;

-- A4. Retrieve all sales on a specific date
-- Purpose: Daily sales report
SELECT
    s.invoice_no,
    b.branch_name,
    c.first_name || ' ' || c.last_name AS customer_name,
    e.first_name || ' ' || e.last_name AS billed_by,
    s.sale_date,
    s.total_amount,
    s.payment_method
FROM sales s
JOIN branches  b ON b.branch_id  = s.branch_id
LEFT JOIN customers c ON c.customer_id = s.customer_id
JOIN employees e ON e.employee_id = s.employee_id
ORDER BY s.sale_date DESC;

-- A5. List all unresolved low-stock alerts
-- Purpose: Procurement team's action list
SELECT
    la.alert_id,
    b.branch_name,
    p.product_name,
    la.current_quantity,
    la.reorder_level,
    la.alert_type,
    la.alert_message,
    la.created_at
FROM low_stock_alerts la
JOIN branches b ON b.branch_id  = la.branch_id
JOIN products p ON p.product_id = la.product_id
WHERE la.is_resolved = FALSE
ORDER BY la.created_at DESC;


-- ============================================================
-- SECTION B: NESTED QUERIES (5)
-- ============================================================

-- B1. Products that have NEVER been sold
-- Purpose: Identify dead stock
SELECT p.product_name, p.brand, p.unit_price
FROM products p
WHERE p.product_id NOT IN (
    SELECT DISTINCT si.product_id
    FROM sale_items si
)
AND p.is_active = TRUE;

-- B2. Customers who have spent MORE than the average customer
-- Purpose: Identify high-value customers for loyalty rewards
SELECT
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.phone,
    SUM(s.total_amount) AS total_spent
FROM customers c
JOIN sales s ON s.customer_id = c.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.phone
HAVING SUM(s.total_amount) > (
    SELECT AVG(branch_total)
    FROM (
        SELECT customer_id, SUM(total_amount) AS branch_total
        FROM sales
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
    ) sub
)
ORDER BY total_spent DESC;

-- B3. Branches where inventory is below the company-wide average reorder level
-- Purpose: Flag branches with high reorder risk
SELECT DISTINCT b.branch_name
FROM branches b
WHERE b.branch_id IN (
    SELECT i.branch_id
    FROM inventory i
    WHERE i.quantity < (
        SELECT AVG(reorder_level) FROM inventory
    )
)
AND b.is_active = TRUE;

-- B4. Top selling product at each branch (using correlated subquery)
-- Purpose: Branch-wise bestseller
SELECT
    b.branch_name,
    p.product_name,
    sub.total_qty_sold
FROM (
    SELECT
        s.branch_id,
        si.product_id,
        SUM(si.quantity) AS total_qty_sold
    FROM sale_items si
    JOIN sales s ON s.sale_id = si.sale_id
    GROUP BY s.branch_id, si.product_id
) sub
JOIN branches b ON b.branch_id  = sub.branch_id
JOIN products p ON p.product_id = sub.product_id
WHERE sub.total_qty_sold = (
    SELECT MAX(inner_sub.total_qty)
    FROM (
        SELECT s2.branch_id, si2.product_id, SUM(si2.quantity) AS total_qty
        FROM sale_items si2
        JOIN sales s2 ON s2.sale_id = si2.sale_id
        GROUP BY s2.branch_id, si2.product_id
    ) inner_sub
    WHERE inner_sub.branch_id = sub.branch_id
)
ORDER BY b.branch_name;

-- B5. Products expiring within the next 60 days with their branch stock
-- Purpose: Expiry management report
SELECT
    p.product_name,
    b.branch_name,
    i.quantity,
    i.batch_number,
    i.expiry_date,
    (i.expiry_date - CURRENT_DATE) AS days_remaining
FROM inventory i
JOIN products p ON p.product_id = i.product_id
JOIN branches b ON b.branch_id  = i.branch_id
WHERE i.expiry_date IS NOT NULL
  AND i.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
  AND i.quantity > 0
ORDER BY i.expiry_date ASC;


-- ============================================================
-- SECTION C: SET OPERATIONS
-- ============================================================

-- C1. UNION: Products stocked at Branch 1 OR Branch 2 (all unique products)
SELECT p.product_id, p.product_name, p.brand, 'Branch 1' AS source
FROM inventory i JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 1
UNION
SELECT p.product_id, p.product_name, p.brand, 'Branch 2' AS source
FROM inventory i JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 2
ORDER BY product_name;

-- C2. UNION ALL: All sales across Branch 1 and Branch 2 (preserves duplicates)
SELECT sale_id, invoice_no, total_amount, 'Branch 1' AS branch_label FROM sales WHERE branch_id = 1
UNION ALL
SELECT sale_id, invoice_no, total_amount, 'Branch 2' AS branch_label FROM sales WHERE branch_id = 2
ORDER BY sale_id;

-- C3. INTERSECT: Products sold at BOTH Branch 1 AND Branch 2
-- Purpose: Common popular products across branches
SELECT si.product_id
FROM sale_items si JOIN sales s ON s.sale_id = si.sale_id WHERE s.branch_id = 1
INTERSECT
SELECT si.product_id
FROM sale_items si JOIN sales s ON s.sale_id = si.sale_id WHERE s.branch_id = 2;

-- C4. INTERSECT: Suppliers who supply to both Branch 1 and Branch 2 via POs
SELECT supplier_id FROM purchase_orders WHERE branch_id = 1
INTERSECT
SELECT supplier_id FROM purchase_orders WHERE branch_id = 2;

-- C5. EXCEPT: Products stocked at Branch 1 but NOT at Branch 2
-- Purpose: Identify branch-exclusive products
SELECT product_id FROM inventory WHERE branch_id = 1
EXCEPT
SELECT product_id FROM inventory WHERE branch_id = 2;

-- C6. EXCEPT: Customers who purchased at Branch 1 but NOT at Branch 2
SELECT DISTINCT customer_id FROM sales WHERE branch_id = 1 AND customer_id IS NOT NULL
EXCEPT
SELECT DISTINCT customer_id FROM sales WHERE branch_id = 2 AND customer_id IS NOT NULL;


-- ============================================================
-- SECTION D: GROUP BY (2) and HAVING (2)
-- ============================================================

-- D1. GROUP BY: Monthly revenue per branch
-- Purpose: Monthly trend analysis
SELECT
    b.branch_name,
    DATE_TRUNC('month', s.sale_date)  AS month,
    COUNT(s.sale_id)                  AS transactions,
    SUM(s.total_amount)               AS revenue,
    AVG(s.total_amount)               AS avg_sale
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
GROUP BY b.branch_name, DATE_TRUNC('month', s.sale_date)
ORDER BY month DESC, revenue DESC;

-- D2. GROUP BY: Total quantity sold per product across all branches
-- Purpose: Product performance report
SELECT
    p.product_name,
    p.brand,
    SUM(si.quantity)        AS total_qty_sold,
    SUM(si.subtotal)        AS total_revenue,
    COUNT(DISTINCT s.sale_id) AS num_transactions
FROM sale_items si
JOIN products p ON p.product_id = si.product_id
JOIN sales    s ON s.sale_id    = si.sale_id
GROUP BY p.product_id, p.product_name, p.brand
ORDER BY total_revenue DESC;

-- D3. HAVING: Branches with total revenue greater than 50000
-- Purpose: High-performing branch filter
SELECT
    b.branch_name,
    SUM(s.total_amount) AS total_revenue
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
GROUP BY b.branch_name
HAVING SUM(s.total_amount) > 50000
ORDER BY total_revenue DESC;

-- D4. HAVING: Products sold more than 10 units total
-- Purpose: Fast-moving product list
SELECT
    p.product_name,
    SUM(si.quantity) AS total_sold
FROM sale_items si
JOIN products p ON p.product_id = si.product_id
GROUP BY p.product_name
HAVING SUM(si.quantity) > 10
ORDER BY total_sold DESC;


-- ============================================================
-- SECTION E: LIKE / BETWEEN (3)
-- ============================================================

-- E1. LIKE: Products whose name starts with 'Para' (e.g., Paracetamol)
SELECT product_name, brand, unit_price, drug_schedule
FROM products
WHERE product_name ILIKE 'Para%'
  AND is_active = TRUE;

-- E2. LIKE: Suppliers in cities matching 'Mumbai' or 'Mumb%'
SELECT supplier_name, contact_person, city, phone
FROM suppliers
WHERE city ILIKE 'Mumb%'
  AND is_active = TRUE;

-- E3. BETWEEN: Sales made in a specific date range (e.g., last 7 days)
-- Purpose: Weekly sales report
SELECT
    s.invoice_no,
    b.branch_name,
    s.sale_date,
    s.total_amount
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
WHERE s.sale_date BETWEEN NOW() - INTERVAL '7 days' AND NOW()
ORDER BY s.sale_date DESC;

-- E4. BETWEEN: Products with unit_price between 50 and 500
SELECT product_name, brand, unit_price, drug_schedule
FROM products
WHERE unit_price BETWEEN 50 AND 500
  AND is_active = TRUE
ORDER BY unit_price;


-- ============================================================
-- SECTION F: CORRELATED SUBQUERY, EXISTS, NOT EXISTS
-- ============================================================

-- F1. CORRELATED SUBQUERY: For each product, show total sold at each branch
-- Purpose: Branch-level product performance
SELECT
    p.product_name,
    b.branch_name,
    (
        SELECT COALESCE(SUM(si.quantity), 0)
        FROM sale_items si
        JOIN sales s ON s.sale_id = si.sale_id
        WHERE si.product_id = p.product_id
          AND s.branch_id   = b.branch_id
    ) AS qty_sold_at_branch
FROM products p
CROSS JOIN branches b
WHERE p.is_active = TRUE AND b.is_active = TRUE
ORDER BY p.product_name, b.branch_name;

-- F2. EXISTS: Branches that have at least one unresolved low-stock alert
-- Purpose: Flag branches requiring urgent procurement action
SELECT b.branch_id, b.branch_name, b.city
FROM branches b
WHERE EXISTS (
    SELECT 1
    FROM low_stock_alerts la
    WHERE la.branch_id  = b.branch_id
      AND la.is_resolved = FALSE
)
AND b.is_active = TRUE;

-- F3. NOT EXISTS: Products that have no purchase orders placed yet
-- Purpose: Identify products with no supply chain setup
SELECT p.product_id, p.product_name, p.brand
FROM products p
WHERE NOT EXISTS (
    SELECT 1
    FROM purchase_order_items poi
    WHERE poi.product_id = p.product_id
)
AND p.is_active = TRUE;


-- ============================================================
-- SECTION G: AGGREGATES across 4+ queries
-- ============================================================

-- G1. COUNT, SUM, AVG across all branches
SELECT
    COUNT(DISTINCT s.sale_id)   AS total_sales,
    COUNT(DISTINCT s.customer_id) AS unique_customers,
    SUM(s.total_amount)         AS total_revenue,
    AVG(s.total_amount)         AS avg_bill_value,
    MIN(s.total_amount)         AS min_bill,
    MAX(s.total_amount)         AS max_bill
FROM sales s;

-- G2. SUM and AVG per payment method
SELECT
    payment_method,
    COUNT(*)            AS num_transactions,
    SUM(total_amount)   AS total_collected,
    AVG(total_amount)   AS avg_per_txn
FROM sales
GROUP BY payment_method
ORDER BY total_collected DESC;

-- G3. MIN and MAX inventory across all branches
SELECT
    p.product_name,
    MIN(i.quantity) AS min_stock_any_branch,
    MAX(i.quantity) AS max_stock_any_branch,
    SUM(i.quantity) AS total_stock_all_branches
FROM inventory i
JOIN products p ON p.product_id = i.product_id
GROUP BY p.product_name
ORDER BY total_stock_all_branches ASC;

-- G4. COUNT of sales and AVG discount by branch
SELECT
    b.branch_name,
    COUNT(s.sale_id)    AS num_sales,
    AVG(s.discount)     AS avg_discount,
    SUM(s.discount)     AS total_discount_given
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
GROUP BY b.branch_name
ORDER BY total_discount_given DESC;
