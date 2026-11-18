BEGIN;

CREATE SEQUENCE IF NOT EXISTS medicine_code_seq START 1 INCREMENT 1;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS medicine_code VARCHAR(30),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

UPDATE products
SET medicine_code = 'MED-' || LPAD(product_id::TEXT, 6, '0')
WHERE medicine_code IS NULL OR BTRIM(medicine_code) = '';

SELECT setval(
    'medicine_code_seq',
    GREATEST(
        COALESCE((SELECT MAX(product_id) FROM products), 0),
        COALESCE((
            SELECT MAX(SUBSTRING(medicine_code FROM '^MED-([0-9]+)$')::BIGINT)
            FROM products
        ), 0)
    ) + 1,
    FALSE
);

ALTER TABLE products
    ALTER COLUMN medicine_code SET DEFAULT
        ('MED-' || LPAD(NEXTVAL('medicine_code_seq')::TEXT, 6, '0')),
    ALTER COLUMN medicine_code SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'products'::regclass
          AND conname = 'uq_products_medicine_code'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT uq_products_medicine_code UNIQUE (medicine_code);
    END IF;
END;
$$;

COMMIT;
