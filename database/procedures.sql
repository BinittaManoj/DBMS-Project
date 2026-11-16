-- =============================================================================
-- MedMart Pharmacy Chain -- Stored Procedures
-- procedures.sql  |  Run AFTER triggers.sql
-- =============================================================================

-- =============================================================================
-- PROCEDURE 1: process_sale
-- Atomically processes a complete sale:
--   1. Locks inventory rows with SELECT ... FOR UPDATE (concurrency safety)
--   2. Validates stock sufficiency for EVERY item before inserting anything
--   3. Inserts the Sale record
--   4. Inserts Sale_Items (Trigger 1 decrements inventory)
--   5. Updates the sale subtotal/total
--   6. Rolls back fully on any error
-- NOTE: This procedure does NOT touch inventory quantities directly.
--       The trigger fn_sale_items_reduce_stock is the only stock-decrementer.
-- =============================================================================
CREATE OR REPLACE PROCEDURE process_sale(
    p_branch_id      INTEGER,
    p_customer_id    INTEGER,          -- NULL for walk-in customer
    p_employee_id    INTEGER,
    p_payment_method VARCHAR(20),
    p_discount       NUMERIC(12,2),    -- rupee discount on the whole bill
    p_notes          TEXT,
    p_prescription_no VARCHAR(50),     -- for Schedule H drugs
    p_items          JSONB             -- [{"product_id":1,"quantity":2,"unit_price":50.00,"discount_pct":0}]
)
LANGUAGE plpgsql AS $$
DECLARE
    v_sale_id      INTEGER;
    v_invoice_no   VARCHAR(30);
    v_subtotal     NUMERIC(12,2) := 0;
    v_tax_amount   NUMERIC(12,2) := 0;
    v_total        NUMERIC(12,2);
    v_item         JSONB;
    v_product_id   INTEGER;
    v_quantity     INTEGER;
    v_unit_price   NUMERIC(12,2);
    v_disc_pct     NUMERIC(5,2);
    v_item_sub     NUMERIC(12,2);
    v_avail_stock  INTEGER;
    v_prod_name    VARCHAR;
BEGIN
    -- -------------------------------------------------------------------------
    -- Step 1: Validate inputs
    -- -------------------------------------------------------------------------
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'process_sale: p_items cannot be empty.';
    END IF;

    IF p_payment_method NOT IN ('CASH','CARD','UPI','INSURANCE') THEN
        RAISE EXCEPTION 'process_sale: Invalid payment method: %', p_payment_method;
    END IF;

    -- -------------------------------------------------------------------------
    -- Step 2: Lock inventory rows and validate stock (FOR UPDATE = row-level lock)
    -- All locks acquired before any insert to prevent deadlocks.
    -- -------------------------------------------------------------------------
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::INTEGER;
        v_quantity   := (v_item->>'quantity')::INTEGER;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'process_sale: Quantity must be positive for product_id=%', v_product_id;
        END IF;

        SELECT i.quantity, p.product_name
          INTO v_avail_stock, v_prod_name
          FROM inventory i
          JOIN products  p ON p.product_id = i.product_id
         WHERE i.branch_id  = p_branch_id
           AND i.product_id = v_product_id
           AND p.is_active  = TRUE
           FOR UPDATE;                 -- row-level lock prevents concurrent over-selling

        IF NOT FOUND THEN
            RAISE EXCEPTION
                'process_sale: Product_id=% not found in inventory for branch_id=%. '
                'Check if product is active and stocked at this branch.',
                v_product_id, p_branch_id;
        END IF;

        IF v_avail_stock < v_quantity THEN
            RAISE EXCEPTION
                'process_sale: Insufficient stock for "%" (product_id=%). '
                'Available: %, Requested: %. Transaction rolled back.',
                v_prod_name, v_product_id, v_avail_stock, v_quantity;
        END IF;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- Step 3: Generate invoice number  INV-YYYYMMDD-NNNN
    -- -------------------------------------------------------------------------
    v_invoice_no := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
                    || LPAD(NEXTVAL('invoice_seq')::TEXT, 4, '0');

    -- -------------------------------------------------------------------------
    -- Step 4: Insert the sale header (totals updated at step 6)
    -- -------------------------------------------------------------------------
    INSERT INTO sales
        (invoice_no, branch_id, customer_id, employee_id,
         sale_date, subtotal, discount, tax_amount, total_amount,
         payment_method, prescription_no, notes)
    VALUES
        (v_invoice_no, p_branch_id, p_customer_id, p_employee_id,
         NOW(), 0, COALESCE(p_discount, 0), 0, 0,
         p_payment_method, p_prescription_no, p_notes)
    RETURNING sale_id INTO v_sale_id;

    -- -------------------------------------------------------------------------
    -- Step 5: Insert sale items (Trigger 1 fires here to decrement inventory)
    -- -------------------------------------------------------------------------
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::INTEGER;
        v_quantity   := (v_item->>'quantity')::INTEGER;
        v_unit_price := (v_item->>'unit_price')::NUMERIC(12,2);
        v_disc_pct   := COALESCE((v_item->>'discount_pct')::NUMERIC(5,2), 0);
        v_item_sub   := ROUND(v_quantity * v_unit_price * (1 - v_disc_pct / 100.0), 2);

        INSERT INTO sale_items
            (sale_id, product_id, quantity, unit_price, discount_pct, subtotal)
        VALUES
            (v_sale_id, v_product_id, v_quantity, v_unit_price, v_disc_pct, v_item_sub);

        v_subtotal := v_subtotal + v_item_sub;
    END LOOP;

    -- -------------------------------------------------------------------------
    -- Step 6: Update sale totals (5% GST on subtotal-discount base)
    -- -------------------------------------------------------------------------
    v_tax_amount := ROUND((v_subtotal - COALESCE(p_discount, 0)) * 0.05, 2);
    v_total      := GREATEST(v_subtotal - COALESCE(p_discount, 0) + v_tax_amount, 0);

    UPDATE sales
    SET  subtotal     = v_subtotal,
         tax_amount   = v_tax_amount,
         total_amount = v_total
    WHERE sale_id = v_sale_id;

    RAISE NOTICE 'process_sale: SUCCESS. Invoice: %, Sale ID: %, Total: %',
        v_invoice_no, v_sale_id, v_total;

EXCEPTION
    WHEN OTHERS THEN
        -- Full rollback happens automatically (procedure runs in caller transaction)
        RAISE;  -- re-raise with original message so caller sees it
END;
$$;

COMMENT ON PROCEDURE process_sale IS
    'Atomically processes a sale: locks inventory (FOR UPDATE), validates stock, '
    'inserts sale + items, triggers stock decrement. Full rollback on failure.';


-- =============================================================================
-- PROCEDURE 2: restock_inventory
-- Adds received stock to Inventory.
-- Optionally linked to a Purchase Order.
-- Validates inputs and raises clear errors on failure.
-- =============================================================================
CREATE OR REPLACE PROCEDURE restock_inventory(
    p_branch_id      INTEGER,
    p_product_id     INTEGER,
    p_quantity       INTEGER,
    p_po_id          INTEGER  DEFAULT NULL,
    p_batch_number   VARCHAR  DEFAULT NULL,
    p_expiry_date    DATE     DEFAULT NULL,
    p_manufacture_date DATE   DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_current_qty   INTEGER;
    v_new_qty       INTEGER;
    v_exists        BOOLEAN;
BEGIN
    -- -------------------------------------------------------------------------
    -- Validate inputs
    -- -------------------------------------------------------------------------
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'restock_inventory: Quantity must be positive. Got: %', p_quantity;
    END IF;

    -- Check branch exists and is active
    IF NOT EXISTS (SELECT 1 FROM branches WHERE branch_id = p_branch_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'restock_inventory: Branch_id=% does not exist or is inactive.', p_branch_id;
    END IF;

    -- Check product exists and is active
    IF NOT EXISTS (SELECT 1 FROM products WHERE product_id = p_product_id AND is_active = TRUE) THEN
        RAISE EXCEPTION 'restock_inventory: Product_id=% does not exist or is inactive.', p_product_id;
    END IF;

    -- Validate PO if provided
    IF p_po_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM purchase_orders WHERE po_id = p_po_id AND branch_id = p_branch_id) THEN
            RAISE EXCEPTION 'restock_inventory: PO_id=% not found for branch_id=%.', p_po_id, p_branch_id;
        END IF;
    END IF;

    -- -------------------------------------------------------------------------
    -- Update or insert inventory (UPSERT pattern)
    -- -------------------------------------------------------------------------
    SELECT quantity INTO v_current_qty
    FROM inventory
    WHERE branch_id = p_branch_id AND product_id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- First time stocking this product at this branch
        INSERT INTO inventory
            (branch_id, product_id, quantity, batch_number,
             expiry_date, manufacture_date, last_restocked_at, updated_at)
        VALUES
            (p_branch_id, p_product_id, p_quantity, p_batch_number,
             p_expiry_date, p_manufacture_date, NOW(), NOW());
        v_new_qty := p_quantity;
    ELSE
        UPDATE inventory
        SET  quantity          = quantity + p_quantity,
             batch_number      = COALESCE(p_batch_number,    batch_number),
             expiry_date       = COALESCE(p_expiry_date,     expiry_date),
             manufacture_date  = COALESCE(p_manufacture_date, manufacture_date),
             last_restocked_at = NOW(),
             updated_at        = NOW()
        WHERE branch_id = p_branch_id AND product_id = p_product_id;
        v_new_qty := v_current_qty + p_quantity;
    END IF;

    -- -------------------------------------------------------------------------
    -- Update Purchase Order if linked
    -- -------------------------------------------------------------------------
    IF p_po_id IS NOT NULL THEN
        UPDATE purchase_order_items
        SET quantity_received = quantity_received + p_quantity
        WHERE po_id = p_po_id AND product_id = p_product_id;

        -- Update PO status based on receipt completion
        UPDATE purchase_orders po
        SET  status        = CASE
                                WHEN (SELECT COALESCE(SUM(quantity_ordered - quantity_received), 0)
                                      FROM purchase_order_items
                                      WHERE po_id = p_po_id) = 0
                                THEN 'RECEIVED'
                                ELSE 'PARTIAL'
                             END,
             received_date = CASE
                                WHEN (SELECT COALESCE(SUM(quantity_ordered - quantity_received), 0)
                                      FROM purchase_order_items
                                      WHERE po_id = p_po_id) = 0
                                THEN CURRENT_DATE ELSE received_date
                             END
        WHERE po_id = p_po_id;
    END IF;

    RAISE NOTICE 'restock_inventory: Restocked % units of product_id=% at branch_id=%. New quantity: %.',
        p_quantity, p_product_id, p_branch_id, v_new_qty;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

COMMENT ON PROCEDURE restock_inventory IS
    'Adds received stock to inventory. Optionally links to a PO. '
    'Updates PO status (PARTIAL/RECEIVED). Validates all inputs.';
