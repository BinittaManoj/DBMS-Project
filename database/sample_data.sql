-- =============================================================================
-- MedMart Pharmacy Chain -- Sample Data
-- =============================================================================

INSERT INTO branches (branch_name, address, city, phone, email, manager_name, gstin, is_active)
VALUES
    ('MedMart Andheri', '12 Link Road, Andheri West', 'Mumbai', '9876501111', 'andheri@medmart.in', 'Riya Shah', '27ABCDE1234F1Z5', TRUE),
    ('MedMart Dadar', '88 Shivaji Park Road, Dadar', 'Mumbai', '9876502222', 'dadar@medmart.in', 'Vikram Desai', '27ABCDE5678F1Z5', TRUE),
    ('MedMart Pune', '21 FC Road, Pune', 'Pune', '9876503333', 'pune@medmart.in', 'Ananya Joshi', '27ABCDE9012F1Z5', TRUE);

INSERT INTO app_user (full_name, email, password_hash, role, branch_id, is_active)
VALUES
    ('General Manager', 'gm@medmart.in', '$2b$12$fuYppuEBbUg..NqjcuIo6.c0lYGKnjwtL31p9oy.iAK0Ow1l/B1pK', 'GENERAL_MANAGER', NULL, TRUE),
    ('Branch 1 Manager', 'branch1@medmart.in', '$2b$12$NbrqyrjvXWD/RngmAWGeYOUUjAoSsBgZjeL0iYvHOzrfTDZyCL9AC', 'BRANCH_MANAGER', 1, TRUE),
    ('Branch 2 Manager', 'branch2@medmart.in', '$2b$12$Fvk4AIgUPANkg6DAlXaf5.ULKa9d0meHJR74s936/WswGRW6d1btO', 'BRANCH_MANAGER', 2, TRUE),
    ('Branch 3 Manager', 'branch3@medmart.in', '$2b$12$Vdg3KX9gwbYnvedGaQj1KOipop0WI/2CLHnjYmWjzEbUo0hY1DqF2', 'BRANCH_MANAGER', 3, TRUE);

INSERT INTO categories (category_name, description, is_active)
VALUES
    ('Pain Relief', 'Pain management products', TRUE),
    ('Cold & Flu', 'Respiratory support and care', TRUE),
    ('Vitamins', 'Nutritional supplements', TRUE),
    ('Skin Care', 'Skin and personal care', TRUE),
    ('First Aid', 'Emergency and wound care', TRUE),
    ('Digestive Care', 'Stomach and digestion support', TRUE),
    ('Eye Care', 'Eye drops and lubricants', TRUE),
    ('Baby Care', 'Baby essentials', TRUE),
    ('Orthopedic', 'Support and mobility products', TRUE),
    ('General Wellness', 'General health and wellness', TRUE);

INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, city, gstin, license_no, is_active)
VALUES
    ('MediCore Pharma', 'Arun Nair', '9820012345', 'arun@medicore.in', 'Bandra East', 'Mumbai', '27AAAA0001A1Z1', 'DL-001', TRUE),
    ('HealthPlus Labs', 'Neha Mehta', '9820012346', 'neha@healthplus.in', 'Lower Parel', 'Mumbai', '27BBBB0002B2Z2', 'DL-002', TRUE),
    ('CityCare Imports', 'Sanjay Jadhav', '9820012347', 'sanjay@citycare.in', 'Pimpri', 'Pune', '27CCCC0003C3Z3', 'DL-003', TRUE),
    ('Wellness Distribution', 'Kavita Kulkarni', '9820012348', 'kavita@wellnessdist.in', 'Chembur', 'Mumbai', '27DDDD0004D4Z4', 'DL-004', TRUE),
    ('Prime Supply Co.', 'Rahul Sethi', '9820012349', 'rahul@primesupply.in', 'Kalyan', 'Mumbai', '27EEEE0005E5Z5', 'DL-005', TRUE);

INSERT INTO products (product_name, brand, category_id, supplier_id, unit_price, cost_price, unit_of_measure, requires_prescription, drug_schedule, hsn_code, shelf_life_days, is_active)
VALUES
    ('Paracetamol 500mg', 'Cipla', 1, 1, 18.00, 11.50, 'STRIP', FALSE, 'OTC', '300490', 365, TRUE),
    ('Ibuprofen 200mg', 'Mankind', 1, 1, 24.00, 15.00, 'STRIP', FALSE, 'OTC', '300490', 365, TRUE),
    ('Cough Syrup 100ml', 'Dabur', 2, 2, 85.00, 52.00, 'BOTTLE', FALSE, 'OTC', '300410', 300, TRUE),
    ('Vitamin C Tablets', 'Zenith', 3, 2, 140.00, 95.00, 'STRIP', FALSE, 'OTC', '300490', 240, TRUE),
    ('Antiseptic Cream', 'Dettol', 4, 3, 70.00, 45.00, 'TUBE', FALSE, 'OTC', '330499', 180, TRUE),
    ('Bandage Roll', 'Curad', 5, 3, 45.00, 28.00, 'PACK', FALSE, 'OTC', '300590', 540, TRUE),
    ('Antacid Tablets', 'Digene', 6, 4, 52.00, 34.00, 'STRIP', FALSE, 'OTC', '300490', 365, TRUE),
    ('Artificial Tears', 'Refresh', 7, 5, 180.00, 120.00, 'BOTTLE', FALSE, 'OTC', '300490', 200, TRUE),
    ('Baby Diaper Size M', 'Pampers', 8, 5, 220.00, 150.00, 'PACK', FALSE, 'OTC', '961900', 365, TRUE),
    ('Knee Support', 'OrthoAid', 9, 4, 420.00, 290.00, 'PAIR', FALSE, 'OTC', '902110', 600, TRUE),
    ('Omega 3 Capsules', 'Nutrilife', 10, 2, 260.00, 170.00, 'BOTTLE', FALSE, 'OTC', '300490', 300, TRUE),
    ('Amoxicillin 500mg', 'Apex', 10, 1, 160.00, 100.00, 'STRIP', TRUE, 'H', '300420', 365, TRUE);

INSERT INTO customers (first_name, last_name, phone, email, address, city, date_of_birth, loyalty_points)
VALUES
    ('Aisha', 'Patel', '9000000001', 'aisha.patel@example.com', '1st Floor, Lokhandwala', 'Mumbai', '1994-04-12', 120),
    ('Rohit', 'Sharma', '9000000002', 'rohit.sharma@example.com', 'Andheri East', 'Mumbai', '1988-11-06', 90),
    ('Priya', 'Menon', '9000000003', 'priya.menon@example.com', 'Baner', 'Pune', '1992-02-14', 145),
    ('Sandeep', 'Kale', '9000000004', 'sandeep.kale@example.com', 'Dadar West', 'Mumbai', '1985-09-01', 80),
    ('Meera', 'Iyer', '9000000005', 'meera.iyer@example.com', 'Khar', 'Mumbai', '1991-07-19', 60),
    ('Vivek', 'Nair', '9000000006', 'vivek.nair@example.com', 'Pimple Saudagar', 'Pune', '1979-12-24', 210),
    ('Nikita', 'Rao', '9000000007', 'nikita.rao@example.com', 'Worli', 'Mumbai', '1998-08-08', 75),
    ('Harsh', 'Singh', '9000000008', 'harsh.singh@example.com', 'Camp', 'Pune', '1990-05-05', 95),
    ('Sakshi', 'Joshi', '9000000009', 'sakshi.joshi@example.com', 'Shivajinagar', 'Pune', '1997-01-18', 150),
    ('Aniket', 'More', '9000000010', 'aniket.more@example.com', 'Powai', 'Mumbai', '1987-10-30', 110);

INSERT INTO employees (branch_id, first_name, last_name, role, phone, email, hire_date, salary, is_active)
VALUES
    (1, 'Nisha', 'Patil', 'MANAGER', '9800000001', 'nisha.patil@medmart.in', '2022-01-09', 42000.00, TRUE),
    (1, 'Yash', 'Mhatre', 'CASHIER', '9800000002', 'yash.mhatre@medmart.in', '2023-02-10', 25000.00, TRUE),
    (1, 'Aditi', 'Kulkarni', 'INVENTORY_STAFF', '9800000003', 'aditi.kulkarni@medmart.in', '2022-08-15', 28000.00, TRUE),
    (2, 'Kunal', 'Rane', 'MANAGER', '9800000004', 'kunal.rane@medmart.in', '2021-11-12', 43000.00, TRUE),
    (2, 'Sneha', 'Verma', 'CASHIER', '9800000005', 'sneha.verma@medmart.in', '2023-01-18', 26000.00, TRUE),
    (2, 'Rajat', 'Sutar', 'INVENTORY_STAFF', '9800000006', 'rajat.sutar@medmart.in', '2022-09-10', 29000.00, TRUE),
    (3, 'Pooja', 'Bharadwaj', 'MANAGER', '9800000007', 'pooja.bharadwaj@medmart.in', '2022-05-23', 45000.00, TRUE),
    (3, 'Manav', 'Shinde', 'CASHIER', '9800000008', 'manav.shinde@medmart.in', '2023-03-11', 27000.00, TRUE),
    (3, 'Tanya', 'Mane', 'INVENTORY_STAFF', '9800000009', 'tanya.mane@medmart.in', '2022-12-05', 30000.00, TRUE);

INSERT INTO inventory (branch_id, product_id, quantity, reorder_level, batch_number, expiry_date, manufacture_date, last_restocked_at, updated_at)
VALUES
    (1, 1, 28, 15, 'BCH-001', '2027-01-15', '2026-01-15', NOW(), NOW()),
    (1, 2, 12, 10, 'BCH-002', '2027-02-20', '2026-02-20', NOW(), NOW()),
    (1, 3, 18, 12, 'BCH-003', '2027-05-23', '2026-05-23', NOW(), NOW()),
    (1, 4, 6, 10, 'BCH-004', '2027-06-05', '2026-06-05', NOW(), NOW()),
    (1, 5, 22, 12, 'BCH-005', '2027-07-11', '2026-07-11', NOW(), NOW()),
    (1, 6, 14, 10, 'BCH-006', '2027-08-15', '2026-08-15', NOW(), NOW()),
    (1, 7, 9, 8, 'BCH-007', '2027-09-28', '2026-09-28', NOW(), NOW()),
    (1, 8, 30, 15, 'BCH-008', '2027-10-16', '2026-10-16', NOW(), NOW()),
    (1, 9, 17, 12, 'BCH-009', '2028-01-01', '2027-01-01', NOW(), NOW()),
    (1, 10, 25, 15, 'BCH-010', '2028-02-20', '2027-02-20', NOW(), NOW()),
    (1, 11, 14, 12, 'BCH-011', '2027-12-30', '2026-12-30', NOW(), NOW()),
    (2, 1, 30, 15, 'BCH-101', '2027-02-10', '2026-02-10', NOW(), NOW()),
    (2, 2, 20, 12, 'BCH-102', '2027-03-05', '2026-03-05', NOW(), NOW()),
    (2, 3, 13, 10, 'BCH-103', '2027-04-15', '2026-04-15', NOW(), NOW()),
    (2, 4, 8, 12, 'BCH-104', '2027-08-01', '2026-08-01', NOW(), NOW()),
    (2, 5, 10, 10, 'BCH-105', '2027-09-09', '2026-09-09', NOW(), NOW()),
    (2, 6, 16, 10, 'BCH-106', '2027-11-11', '2026-11-11', NOW(), NOW()),
    (2, 7, 27, 12, 'BCH-107', '2027-03-18', '2026-03-18', NOW(), NOW()),
    (2, 8, 11, 10, 'BCH-108', '2027-12-12', '2026-12-12', NOW(), NOW()),
    (2, 9, 14, 12, 'BCH-109', '2028-02-14', '2027-02-14', NOW(), NOW()),
    (2, 10, 18, 10, 'BCH-110', '2028-05-11', '2027-05-11', NOW(), NOW()),
    (2, 11, 21, 12, 'BCH-111', '2027-11-17', '2026-11-17', NOW(), NOW()),
    (3, 1, 25, 12, 'BCH-201', '2027-03-14', '2026-03-14', NOW(), NOW()),
    (3, 2, 17, 10, 'BCH-202', '2027-05-22', '2026-05-22', NOW(), NOW()),
    (3, 3, 12, 10, 'BCH-203', '2027-02-02', '2026-02-02', NOW(), NOW()),
    (3, 4, 19, 12, 'BCH-204', '2027-01-31', '2026-01-31', NOW(), NOW()),
    (3, 5, 11, 10, 'BCH-205', '2027-06-05', '2026-06-05', NOW(), NOW()),
    (3, 6, 15, 10, 'BCH-206', '2027-07-08', '2026-07-08', NOW(), NOW()),
    (3, 7, 21, 12, 'BCH-207', '2027-08-20', '2026-08-20', NOW(), NOW()),
    (3, 8, 8, 10, 'BCH-208', '2027-11-16', '2026-11-16', NOW(), NOW()),
    (3, 9, 29, 15, 'BCH-209', '2028-03-06', '2027-03-06', NOW(), NOW()),
    (3, 10, 16, 12, 'BCH-210', '2028-04-18', '2027-04-18', NOW(), NOW()),
    (3, 11, 9, 10, 'BCH-211', '2027-10-25', '2026-10-25', NOW(), NOW());

INSERT INTO purchase_orders (po_number, branch_id, supplier_id, employee_id, po_date, expected_delivery, status, total_amount, notes)
VALUES
    ('PO-202601-001', 1, 1, 3, NOW() - INTERVAL '15 days', CURRENT_DATE + INTERVAL '7 days', 'RECEIVED', 3678.00, 'Regular restock'),
    ('PO-202601-002', 2, 2, 6, NOW() - INTERVAL '10 days', CURRENT_DATE + INTERVAL '5 days', 'PARTIAL', 2540.00, 'Cold & flu essentials'),
    ('PO-202601-003', 3, 4, 9, NOW() - INTERVAL '20 days', CURRENT_DATE + INTERVAL '8 days', 'RECEIVED', 2980.00, 'Monthly replenishment');

INSERT INTO purchase_order_items (po_id, product_id, quantity_ordered, quantity_received, unit_cost, batch_number, expiry_date, manufacture_date, subtotal)
VALUES
    (1, 1, 50, 50, 11.50, 'REC-001', '2027-01-15', '2026-01-15', 575.00),
    (1, 2, 30, 30, 15.00, 'REC-002', '2027-02-20', '2026-02-20', 450.00),
    (1, 4, 25, 20, 95.00, 'REC-004', '2027-06-05', '2026-06-05', 2375.00),
    (2, 3, 20, 10, 52.00, 'REC-003', '2027-05-23', '2026-05-23', 1040.00),
    (2, 8, 10, 10, 120.00, 'REC-008', '2027-10-16', '2026-10-16', 1200.00),
    (3, 6, 28, 28, 28.00, 'REC-006', '2027-08-15', '2026-08-15', 784.00),
    (3, 10, 18, 18, 170.00, 'REC-010', '2028-02-20', '2027-02-20', 3060.00);

-- Update stock and receipt totals for sample POs
UPDATE purchase_orders SET total_amount = 3678.00 WHERE po_id = 1;
UPDATE purchase_orders SET total_amount = 2540.00 WHERE po_id = 2;
UPDATE purchase_orders SET total_amount = 2980.00 WHERE po_id = 3;

-- Sales inserted through the process_sale procedure to maintain stock consistency.
CALL process_sale(1, 1, 2, 'CASH', 0, 'Routine purchase', NULL, '[{"product_id":1,"quantity":5,"unit_price":18.00,"discount_pct":0},{"product_id":3,"quantity":2,"unit_price":85.00,"discount_pct":0}]');
CALL process_sale(1, 2, 2, 'UPI', 15, 'Medicine refill', NULL, '[{"product_id":2,"quantity":3,"unit_price":24.00,"discount_pct":0},{"product_id":5,"quantity":1,"unit_price":70.00,"discount_pct":10}]');
CALL process_sale(2, 3, 5, 'CARD', 20, 'Health check purchase', NULL, '[{"product_id":7,"quantity":2,"unit_price":52.00,"discount_pct":0},{"product_id":8,"quantity":1,"unit_price":180.00,"discount_pct":5}]');
CALL process_sale(2, 4, 5, 'CASH', 0, 'Family purchase', NULL, '[{"product_id":1,"quantity":6,"unit_price":18.00,"discount_pct":0},{"product_id":9,"quantity":2,"unit_price":220.00,"discount_pct":0}]');
CALL process_sale(3, 5, 8, 'UPI', 10, 'Seasonal purchase', NULL, '[{"product_id":10,"quantity":2,"unit_price":260.00,"discount_pct":0},{"product_id":11,"quantity":1,"unit_price":260.00,"discount_pct":5}]');
CALL process_sale(3, 6, 8, 'CARD', 0, 'Monthly restock', NULL, '[{"product_id":4,"quantity":3,"unit_price":140.00,"discount_pct":0},{"product_id":6,"quantity":4,"unit_price":45.00,"discount_pct":0}]');
CALL process_sale(1, 7, 2, 'CASH', 0, NULL, NULL, '[{"product_id":5,"quantity":2,"unit_price":70.00,"discount_pct":0},{"product_id":6,"quantity":5,"unit_price":45.00,"discount_pct":5}]');
CALL process_sale(2, 8, 5, 'UPI', 5, 'Support purchase', NULL, '[{"product_id":10,"quantity":1,"unit_price":420.00,"discount_pct":0},{"product_id":11,"quantity":2,"unit_price":260.00,"discount_pct":10}]');
CALL process_sale(3, 9, 8, 'CARD', 25, 'Wellness purchase', NULL, '[{"product_id":3,"quantity":3,"unit_price":85.00,"discount_pct":0},{"product_id":1,"quantity":4,"unit_price":18.00,"discount_pct":0}]');
CALL process_sale(1, 10, 2, 'CASH', 0, 'Skin care essentials', NULL, '[{"product_id":4,"quantity":2,"unit_price":140.00,"discount_pct":0},{"product_id":5,"quantity":3,"unit_price":70.00,"discount_pct":0}]');
CALL process_sale(2, 1, 5, 'UPI', 0, 'Fast moving items', NULL, '[{"product_id":7,"quantity":4,"unit_price":52.00,"discount_pct":0},{"product_id":6,"quantity":3,"unit_price":45.00,"discount_pct":0}]');
CALL process_sale(3, 3, 8, 'CASH', 15, 'Household purchase', NULL, '[{"product_id":9,"quantity":1,"unit_price":220.00,"discount_pct":0},{"product_id":8,"quantity":1,"unit_price":180.00,"discount_pct":0}]');
CALL process_sale(1, 5, 2, 'CARD', 10, 'Routine check', NULL, '[{"product_id":1,"quantity":2,"unit_price":18.00,"discount_pct":0},{"product_id":2,"quantity":2,"unit_price":24.00,"discount_pct":0}]');
CALL process_sale(2, 6, 5, 'UPI', 0, 'Prescription purchase', NULL, '[{"product_id":12,"quantity":1,"unit_price":160.00,"discount_pct":0}]');
CALL process_sale(3, 4, 8, 'CASH', 0, 'Cosmetics and care', NULL, '[{"product_id":5,"quantity":2,"unit_price":70.00,"discount_pct":0},{"product_id":10,"quantity":1,"unit_price":420.00,"discount_pct":0}]');
CALL process_sale(1, 8, 2, 'CARD', 20, 'Family purchase', NULL, '[{"product_id":3,"quantity":1,"unit_price":85.00,"discount_pct":0},{"product_id":4,"quantity":1,"unit_price":140.00,"discount_pct":0}]');
CALL process_sale(2, 9, 5, 'UPI', 0, 'Daily essentials', NULL, '[{"product_id":6,"quantity":2,"unit_price":45.00,"discount_pct":0},{"product_id":7,"quantity":3,"unit_price":52.00,"discount_pct":0}]');
CALL process_sale(3, 10, 8, 'CASH', 0, 'Health essentials', NULL, '[{"product_id":1,"quantity":5,"unit_price":18.00,"discount_pct":0},{"product_id":11,"quantity":1,"unit_price":260.00,"discount_pct":0}]');
CALL process_sale(1, 3, 2, 'CARD', 5, 'Daily medicines', NULL, '[{"product_id":4,"quantity":2,"unit_price":140.00,"discount_pct":0},{"product_id":5,"quantity":1,"unit_price":70.00,"discount_pct":0}]');
CALL process_sale(2, 7, 5, 'UPI', 25, 'Rapid purchase', NULL, '[{"product_id":2,"quantity":5,"unit_price":24.00,"discount_pct":0},{"product_id":10,"quantity":1,"unit_price":420.00,"discount_pct":0}]');
CALL process_sale(3, 2, 8, 'CASH', 10, 'routine', NULL, '[{"product_id":8,"quantity":1,"unit_price":180.00,"discount_pct":0},{"product_id":6,"quantity":2,"unit_price":45.00,"discount_pct":0}]');

-- Create a few low-stock alerts by reducing some item quantities through direct inventory update.
UPDATE inventory SET quantity = 4 WHERE branch_id = 1 AND product_id = 4;
UPDATE inventory SET quantity = 7 WHERE branch_id = 2 AND product_id = 8;
UPDATE inventory SET quantity = 5 WHERE branch_id = 3 AND product_id = 11;

SELECT 'Sample data loaded successfully.';
