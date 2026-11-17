BEGIN;

LOCK TABLE inventory, sale_items IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sale_items
        GROUP BY sale_id, product_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot add sale_items composite primary key: duplicate sale_id/product_id pairs exist.';
    END IF;
END;
$$;

ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_pkey;
ALTER TABLE inventory ADD CONSTRAINT inventory_pkey PRIMARY KEY (branch_id, product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_inventory_id ON inventory (inventory_id);

ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_pkey;
ALTER TABLE sale_items ADD CONSTRAINT sale_items_pkey PRIMARY KEY (sale_id, product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sale_items_sale_item_id ON sale_items (sale_item_id);

COMMIT;
