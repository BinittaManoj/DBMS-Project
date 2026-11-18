CREATE OR REPLACE PROCEDURE process_sale(
    p_branch_id       INTEGER,
    p_customer_id     INTEGER,
    p_employee_id     INTEGER,
    p_payment_method  VARCHAR(20),
    p_discount        NUMERIC(12,2),
    p_notes           TEXT,
    p_prescription_no VARCHAR(50),
    p_items            JSONB
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
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'process_sale: p_items cannot be empty.';
    END IF;

    IF p_payment_method NOT IN ('CASH','CARD','UPI','INSURANCE') THEN
        RAISE EXCEPTION 'process_sale: Invalid payment method: %', p_payment_method;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(p_items) AS line
        GROUP BY (line->>'product_id')::INTEGER
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'process_sale: Each product may appear only once per sale. Combine quantities for duplicate product IDs.';
    END IF;

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
          JOIN products p ON p.product_id = i.product_id
         WHERE i.branch_id = p_branch_id
           AND i.product_id = v_product_id
           AND p.is_active = TRUE
           FOR UPDATE OF i;

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

    v_invoice_no := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
                    || LPAD(NEXTVAL('invoice_seq')::TEXT, 4, '0');

    INSERT INTO sales
        (invoice_no, branch_id, customer_id, employee_id,
         sale_date, subtotal, discount, tax_amount, total_amount,
         payment_method, prescription_no, notes)
    VALUES
        (v_invoice_no, p_branch_id, p_customer_id, p_employee_id,
         NOW(), 0, COALESCE(p_discount, 0), 0, 0,
         p_payment_method, p_prescription_no, p_notes)
    RETURNING sale_id INTO v_sale_id;

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

    v_tax_amount := ROUND((v_subtotal - COALESCE(p_discount, 0)) * 0.05, 2);
    v_total      := GREATEST(v_subtotal - COALESCE(p_discount, 0) + v_tax_amount, 0);

    UPDATE sales
    SET subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total
    WHERE sale_id = v_sale_id;

    RAISE NOTICE 'process_sale: SUCCESS. Invoice: %, Sale ID: %, Total: %',
        v_invoice_no, v_sale_id, v_total;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

COMMENT ON PROCEDURE process_sale IS
    'Atomically processes sales while locking only the inventory row for the requested branch and product.';
