-- =============================================================================
-- MedMart Pharmacy Chain -- Database Views
-- views.sql  |  Run AFTER procedures.sql
-- =============================================================================

-- =============================================================================
-- VIEW 1: v_branch_sales_summary
-- Purpose: Shows each branch with its total transactions and revenue.
-- Used by: Dashboard charts, Branch-wise sales report.
-- =============================================================================
CREATE OR REPLACE VIEW v_branch_sales_summary AS
SELECT
    b.branch_id,
    b.branch_name,
    b.city,
    COUNT(s.sale_id)              AS total_transactions,
    COALESCE(SUM(s.total_amount), 0) AS total_revenue,
    COALESCE(AVG(s.total_amount), 0) AS avg_sale_value,
    COALESCE(MAX(s.sale_date),    NULL) AS last_sale_date
FROM branches b
LEFT JOIN sales s ON s.branch_id = b.branch_id
WHERE b.is_active = TRUE
GROUP BY b.branch_id, b.branch_name, b.city
ORDER BY total_revenue DESC;

COMMENT ON VIEW v_branch_sales_summary IS
    'View 1: Per-branch aggregated sales: transaction count, total revenue, average sale value.';

-- =============================================================================
-- VIEW 2: v_inventory_status
-- Purpose: Full inventory view with stock status, reorder recommendation,
--          expiry information, and reorder formula visible to the user.
-- Reorder formula: CEIL(avg_daily_sales_30d * 7) - current_qty, minimum 0
-- Used by: Inventory page, low-stock report.
-- =============================================================================
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT
    i.inventory_id,
    b.branch_id,
    b.branch_name,
    p.product_id,
    p.product_name,
    p.brand,
    c.category_name,
    p.unit_of_measure,
    p.drug_schedule,
    i.quantity            AS current_qty,
    i.reorder_level,
    i.batch_number,
    i.expiry_date,
    i.manufacture_date,
    i.last_restocked_at,
    -- Stock status flag
    CASE
        WHEN i.quantity = 0                      THEN 'OUT_OF_STOCK'
        WHEN i.quantity < i.reorder_level        THEN 'LOW_STOCK'
        WHEN i.expiry_date < CURRENT_DATE + 30   THEN 'NEAR_EXPIRY'
        ELSE                                          'OK'
    END AS stock_status,
    -- Days until expiry
    (i.expiry_date - CURRENT_DATE)              AS days_to_expiry,
    -- Average daily sales (last 30 days)
    COALESCE(
        (
            SELECT ROUND(SUM(si.quantity)::NUMERIC / 30, 4)
            FROM   sale_items si
            JOIN   sales      s  ON s.sale_id = si.sale_id
            WHERE  si.product_id = i.product_id
              AND  s.branch_id   = i.branch_id
              AND  s.sale_date  >= NOW() - INTERVAL '30 days'
        ), 0
    ) AS avg_daily_sales_30d,
    -- Reorder recommendation: CEIL(avg_daily_sales * 7) - current_qty, min 0
    GREATEST(
        CEIL(
            COALESCE(
                (
                    SELECT ROUND(SUM(si.quantity)::NUMERIC / 30, 4)
                    FROM   sale_items si
                    JOIN   sales      s  ON s.sale_id = si.sale_id
                    WHERE  si.product_id = i.product_id
                      AND  s.branch_id   = i.branch_id
                      AND  s.sale_date  >= NOW() - INTERVAL '30 days'
                ), 0
            ) * 7
        ) - i.quantity,
        0
    )::INTEGER AS recommended_reorder_qty,
    -- Formula string shown in UI
    'CEIL(avg_daily_sales_30d × 7) − current_qty  (min 0)' AS reorder_formula
FROM inventory  i
JOIN branches   b ON b.branch_id  = i.branch_id
JOIN products   p ON p.product_id = i.product_id
JOIN categories c ON c.category_id = p.category_id
WHERE b.is_active = TRUE
  AND p.is_active = TRUE
ORDER BY
    CASE
        WHEN i.quantity = 0 THEN 1
        WHEN i.quantity < i.reorder_level THEN 2
        ELSE 3
    END,
    b.branch_name, p.product_name;

COMMENT ON VIEW v_inventory_status IS
    'View 2: Complete inventory status per branch+product: stock level, expiry, '
    'avg daily sales (30d), and reorder recommendation using CEIL(avg×7)-qty formula.';
