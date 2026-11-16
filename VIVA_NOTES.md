# Viva notes

## 1NF to 3NF

The system begins with a single large table idea and is decomposed into smaller relations to remove redundancy and update anomalies.

### 1NF

Each table contains atomic values and has a primary key. For example, each `sales` record is a single transaction and each `sale_items` row contains one sold item, not a list of products.

### 2NF

Every non-key attribute in a table depends on the entire primary key. For example, `sale_items` stores `product_id`, `quantity`, `unit_price`, and `subtotal`; these are related to the `sale_id` and the item row itself, not only part of the key.

### 3NF

No non-key column depends on another non-key column. For example, `products` stores supplier and category IDs rather than repeating supplier name and category name directly, keeping the database normalized and reducing update anomalies.

## Functional dependencies

- `branch_id -> branch_name, address, city, phone, ...`
- `product_id -> product_name, brand, category_id, supplier_id, unit_price, ...`
- `customer_id -> first_name, last_name, phone, ...`
- `sale_id -> branch_id, customer_id, employee_id, sale_date, total_amount, ...`
- `inventory_id -> branch_id, product_id, quantity, reorder_level, ...`

These dependencies justify separate tables instead of one monolithic transaction table.

## Why the trigger plus procedure pattern

The trigger on `sale_items` is the single authoritative place where stock is decremented. This ensures there is only one code path for inventory reduction. The stored procedure validates stock using row locks before insertion, and the trigger performs the actual decrement. This pattern prevents duplicate logic, keeps inventory rules centralized, and reduces inconsistent updates.

## Why row locking

`SELECT ... FOR UPDATE` is used to lock inventory rows before stock check. Without this, multiple concurrent sales could both read the same stock and allow overselling. The row lock ensures the stock check and subsequent decrement happen atomically per transaction.

## Likely viva questions and answers

### Q1. Why is this database in 3NF?

Because every table has atomic values, all non-key attributes depend on the primary key, and no non-key field depends on another non-key field.

### Q2. Why not store all product details inside sales?

That would duplicate product information and create inconsistent data. Using `product_id` keeps the design normalized and lets product metadata be maintained in one place.

### Q3. Why do we use `Inventory` as a separate table instead of storing stock with products?

Stock varies by branch, so the same product can have different quantities at different branches. `inventory` resolves this as a many-to-many relationship with a branch and product pair.

### Q4. What happens if stock is insufficient?

The stored procedure validates inventory before inserting the sale; it raises an error and returns to the caller without finalizing the transaction.

### Q5. Why are alerts triggered only on crossing the reorder level?

This avoids duplicate low-stock rows for every database update after a product is already below the threshold. The trigger only fires when stock crosses from okay to below reorder level.

### Q6. Why use `NUMERIC(12,2)` for money?

It avoids floating-point precision issues and is appropriate for monetary values in a retail system.

### Q7. What is the role of the view?

The view simplifies reporting by joining inventory and sales data into one logical structure for dashboards and inventory decisions.

### Q8. Why are soft deletes used for products?

It preserves historical sales integrity and prevents accidental loss of transaction history. If a product is never used in any sale and is truly obsolete, it can be hard deleted in a controlled workflow.

## ER relationships

- Branches to Employees: one branch has many employees.
- Branches to Inventory: one branch manages many inventory rows.
- Products to Inventory: one product can appear in many branch inventory rows.
- Products to Sale Items: one product can appear in many sale items.
- Sales to Sale Items: one sale contains many sale items.
- Suppliers to Products: one supplier can supply many products.
- Categories to Products: one category can contain many products.
- Customers to Sales: one customer can have many sales.
- Purchase orders to purchase order items: one PO has many items.

## Summary

The design balances normalized structure, operational correctness, and simplicity for a DBMS class project. This makes it suitable for viva explanations, practical database design, and transaction-level concurrency questions.
