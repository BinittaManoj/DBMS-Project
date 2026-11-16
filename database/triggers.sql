-- =============================================================================
-- MedMart Pharmacy Chain -- Triggers
-- triggers.sql  |  Run AFTER schema.sql
-- =============================================================================

-- =============================================================================
-- TRIGGER 1: Reduce inventory on sale_items INSERT
-- This is THE ONLY place stock is decremented.
-- The process_sale procedure validates stock BEFORE inserting sale_items,
-- so by the time this trigger fires, stock is guaranteed to be sufficient.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_sale_items_reduce_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_id  INTEGER;
    v_new_qty    INTEGER;
BEGIN
    -- Get the branch from the parent sale
    SELECT branch_id INTO v_branch_id
    FROM sales
    WHERE sale_id = NEW.sale_id;

    -- Decrement stock (quantity CHECK >= 0 will raise an error if stock goes negative)
    UPDATE inventory
    SET  quantity   = quantity - NEW.quantity,
         updated_at = NOW()
    WHERE branch_id = v_branch_id
      AND product_id = NEW.product_id
    RETURNING quantity INTO v_new_qty;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'TRIGGER ERROR: No inventory record for product_id=% at branch_id=%. '
            'Cannot decrement stock.',
            NEW.product_id, v_branch_id;
    END IF;

    -- Safety net: quantity CHECK constraint handles negatives, but explicit guard
    IF v_new_qty < 0 THEN
        RAISE EXCEPTION
            'TRIGGER ERROR: Stock would go negative for product_id=% at branch_id=%. '
            'Available after decrement: %.',
            NEW.product_id, v_branch_id, v_new_qty;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sale_items_reduce_stock ON sale_items;
CREATE TRIGGER trg_sale_items_reduce_stock
    AFTER INSERT ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_sale_items_reduce_stock();

COMMENT ON FUNCTION fn_sale_items_reduce_stock() IS
    'Trigger 1: Decrements inventory.quantity for the sale branch+product after every sale_items INSERT. '
    'This is the single authoritative place stock is reduced.';

-- =============================================================================
-- TRIGGER 2: Insert low-stock alert ONLY when quantity crosses the threshold
-- Fires AFTER UPDATE on inventory.
-- Condition: OLD.quantity >= reorder_level  AND  NEW.quantity < reorder_level
-- This prevents duplicate alerts on every subsequent update while already below level.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_low_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name VARCHAR;
    v_branch_name  VARCHAR;
    v_alert_type   VARCHAR(20);
    v_message      TEXT;
BEGIN
    -- Only fire when crossing FROM at/above TO below reorder level
    IF OLD.quantity >= OLD.reorder_level AND NEW.quantity < NEW.reorder_level THEN

        v_alert_type := CASE
            WHEN NEW.quantity = 0 THEN 'OUT_OF_STOCK'
            ELSE 'LOW_STOCK'
        END;

        -- Fetch readable names for the message
        SELECT product_name INTO v_product_name FROM products WHERE product_id = NEW.product_id;
        SELECT branch_name  INTO v_branch_name  FROM branches  WHERE branch_id  = NEW.branch_id;

        v_message := format(
            '%s: %s at %s has only %s units (reorder level: %s).',
            v_alert_type, v_product_name, v_branch_name, NEW.quantity, NEW.reorder_level
        );

        INSERT INTO low_stock_alerts
            (branch_id, product_id, current_quantity, reorder_level, alert_type, alert_message)
        VALUES
            (NEW.branch_id, NEW.product_id, NEW.quantity, NEW.reorder_level, v_alert_type, v_message);

        RAISE NOTICE '%', v_message;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_low_stock_alert ON inventory;
CREATE TRIGGER trg_low_stock_alert
    AFTER UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION fn_low_stock_alert();

COMMENT ON FUNCTION fn_low_stock_alert() IS
    'Trigger 2: Inserts a low_stock_alerts row ONLY when inventory.quantity crosses '
    'from at/above the reorder_level to below it. Prevents duplicate alerts.';
