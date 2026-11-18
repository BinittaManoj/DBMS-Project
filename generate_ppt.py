"""
Generate PowerPoint Presentation for MedMart DBMS Laboratory (24CS520 / 20CS41L)
Event 1: Phase 1 & Phase 2 Complete Query Catalog & Technical Architecture Presentation
JSS Science and Technology University - SJCE Mysuru, Department of CSE
Course Faculty: Dr. Trisiladevi C. Nagavi
"""

import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_path="MedMart_DBMS_Event1_Presentation.pptx"):
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)       # Slate 900
    BG_CARD = RGBColor(30, 41, 59)      # Slate 800
    BG_LIGHT = RGBColor(248, 250, 252)   # Slate 50
    CARD_LIGHT = RGBColor(255, 255, 255) # Pure White
    BORDER_LIGHT = RGBColor(226, 232, 240)
    
    PRIMARY_INDIGO = RGBColor(79, 70, 229) # Indigo 600
    ACCENT_TEAL = RGBColor(13, 148, 136)   # Teal 600
    TEXT_DARK = RGBColor(15, 23, 42)
    TEXT_MUTED = RGBColor(100, 116, 139)
    TEXT_LIGHT = RGBColor(241, 245, 249)
    CODE_BG = RGBColor(15, 23, 42)        # Dark code background
    CODE_TEXT = RGBColor(226, 232, 240)
    KEYWORD_COLOR = RGBColor(56, 189, 248) # Sky blue
    ALERT_RED = RGBColor(225, 29, 72)
    SUCCESS_GREEN = RGBColor(16, 185, 129)

    def add_header(slide, title, category, slide_num, total_slides=26):
        # Header banner
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.1))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_top = tf.margin_bottom = tf.margin_left = tf.margin_right = 0
        
        # Category / Eyebrow
        p_cat = tf.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = PRIMARY_INDIGO
        p_cat.font.name = "Segoe UI"
        
        # Title
        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_DARK
        p_title.font.name = "Segoe UI"

        # Slide Number
        num_box = slide.shapes.add_textbox(Inches(11.5), Inches(0.4), Inches(1.0), Inches(0.4))
        ntf = num_box.text_frame
        np = ntf.paragraphs[0]
        np.text = f"{slide_num}/{total_slides}"
        np.alignment = PP_ALIGN.RIGHT
        np.font.size = Pt(10)
        np.font.color.rgb = TEXT_MUTED
        np.font.name = "Segoe UI"

        # Subtle bottom line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(0.02))
        line.fill.solid()
        line.fill.fore_color.rgb = BORDER_LIGHT
        line.line.color.rgb = BORDER_LIGHT

    def add_footer(slide):
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
        ftf = footer_box.text_frame
        ftf.word_wrap = True
        ftf.margin_top = ftf.margin_bottom = ftf.margin_left = ftf.margin_right = 0
        fp = ftf.paragraphs[0]
        fp.text = "MedMart: Retail Inventory & Sales Analytics | JSS STU, SJCE Mysuru - CSE | Course Guide: Dr. Trisiladevi C. Nagavi"
        fp.font.size = Pt(9)
        fp.font.color.rgb = TEXT_MUTED
        fp.font.name = "Segoe UI"

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = BG_DARK
    bg1.line.fill.background()

    # Title Card
    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.333), Inches(5.0))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p0 = tf1.paragraphs[0]
    p0.text = "JSS SCIENCE AND TECHNOLOGY UNIVERSITY · SJCE MYSURU\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(148, 163, 184)
    p0.font.name = "Segoe UI"
    p0.space_after = Pt(20)

    p1 = tf1.add_paragraph()
    p1.text = "MEDMART: MULTI-BRANCH PHARMACY INVENTORY\n& RETAIL SALES ANALYTICS SYSTEM"
    p1.font.size = Pt(30)
    p1.font.bold = True
    p1.font.color.rgb = RGBColor(255, 255, 255)
    p1.font.name = "Segoe UI"
    p1.space_after = Pt(14)

    p2 = tf1.add_paragraph()
    p2.text = "Event 1 (Phase 1 & Phase 2) Comprehensive SQL Architecture, Query Catalog & Technical Viva Defense"
    p2.font.size = Pt(15)
    p2.font.color.rgb = RGBColor(56, 189, 248)
    p2.font.name = "Segoe UI"
    p2.space_after = Pt(36)

    p3 = tf1.add_paragraph()
    p3.text = "Course: Database Management Systems Laboratory (24CS520 / 20CS41L / CS430)\n" \
              "Under the Guidance of: Dr. Trisiladevi C. Nagavi, Professor/Associate Professor, Dept. of CSE, SJCE, JSS STU\n" \
              "Academic Year: 2025–2026 | Database Engine: PostgreSQL 16 | Architecture: 13 Normalized Relational Tables"
    p3.font.size = Pt(12)
    p3.font.color.rgb = RGBColor(203, 213, 225)
    p3.font.name = "Segoe UI"

    # ==========================================
    # SLIDE 2: SYLLABUS COMPLIANCE MATRIX (EVENT 1)
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Event 1 Syllabus Compliance & Rubric Coverage", "DBMS Course Deliverables", 2)
    add_footer(s2)

    # 2-column compliance table/cards
    # Left Card: Phase 1
    c1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    c1.fill.solid()
    c1.fill.fore_color.rgb = CARD_LIGHT
    c1.line.color.rgb = BORDER_LIGHT
    tf_c1 = c1.text_frame
    tf_c1.word_wrap = True
    tf_c1.margin_left = tf_c1.margin_right = tf_c1.margin_top = Inches(0.25)
    
    p = tf_c1.paragraphs[0]
    p.text = "EVENT 1: PHASE 1 REQUIREMENTS"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(10)

    items_p1 = [
        ("✔ 6 Tables Min (with PK, FK):", "13 Normalized Tables in 3NF / BCNF"),
        ("✔ Min 5 Attributes per Table:", "All tables have 5 to 13 typed attributes"),
        ("✔ Simple Queries (5 Required):", "5 Production queries (Catalog, HR, Stock, Ledger, Schedule H)"),
        ("✔ Nested Subqueries (5 Required):", "5 Subqueries (NOT IN, HAVING > AVG, IN subquery, etc.)"),
        ("✔ SET Operations (Each 1 required):", "UNION (2), INTERSECT (2), EXCEPT (2) implemented"),
        ("✔ GROUP BY (2 Required):", "Monthly Branch Sales & Product Revenue aggregation"),
        ("✔ HAVING (2 Required):", "High-revenue branches (>₹50k) & fast-movers (>10 units)"),
        ("✔ LIKE & BETWEEN (3 Required):", "Prefix search (ILIKE 'Para%') & Date/Price BETWEEN ranges"),
    ]
    for label, val in items_p1:
        p = tf_c1.add_paragraph()
        p.text = f"{label} {val}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(4)

    # Right Card: Phase 2
    c2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.833), Inches(1.8), Inches(5.7), Inches(5.0))
    c2.fill.solid()
    c2.fill.fore_color.rgb = CARD_LIGHT
    c2.line.color.rgb = BORDER_LIGHT
    tf_c2 = c2.text_frame
    tf_c2.word_wrap = True
    tf_c2.margin_left = tf_c2.margin_right = tf_c2.margin_top = Inches(0.25)

    p = tf_c2.paragraphs[0]
    p.text = "EVENT 1: PHASE 2 ADVANCED FEATURES"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(10)

    items_p2 = [
        ("✔ Correlated Queries (1 Req):", "Correlated branch-product volume matrix"),
        ("✔ Database Views (2 Required):", "v_branch_sales_summary & v_inventory_status"),
        ("✔ EXISTS & NOT EXISTS (2 Req):", "Low-stock alert detection & Unordered catalog check"),
        ("✔ Aggregate Functions (4 Req):", "COUNT, SUM, AVG, MIN, MAX across transactions"),
        ("✔ Triggers (2 Required):", "trg_sale_items_reduce_stock & trg_low_stock_alert"),
        ("✔ Stored Procedures (2 Req):", "process_sale (with FOR UPDATE) & restock_inventory"),
        ("✔ Frontend (Min 5 Forms):", "Main Dashboard, POS Cart, Stock CRUD, Branches, SQL Console"),
        ("✔ Report Generation (2 Req):", "Branch Sales Summary & Expiry/Inventory Status Reports"),
    ]
    for label, val in items_p2:
        p = tf_c2.add_paragraph()
        p.text = f"{label} {val}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(4)

    # ==========================================
    # SLIDE 3: RELATIONAL SCHEMA ARCHITECTURE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Relational Schema & 13 Table Entity Architecture", "Database Modeling", 3)
    add_footer(s3)

    # 3 Column cards describing table clusters
    col_width = Inches(3.75)
    clusters = [
        ("Core Master Tables", PRIMARY_INDIGO, [
            ("branches", "branch_id (PK), branch_name, address, city, phone, gstin"),
            ("products", "product_id (PK), medicine_code, product_name, category_id (FK), supplier_id (FK), unit_price, cost_price, requires_prescription, drug_schedule"),
            ("categories", "category_id (PK), category_name, description"),
            ("suppliers", "supplier_id (PK), supplier_name, gstin, city, phone"),
            ("employees", "employee_id (PK), branch_id (FK), full_name, role, email"),
        ]),
        ("Inventory & Operations", ACCENT_TEAL, [
            ("inventory", "(branch_id, product_id) (Composite PK), quantity, reorder_level, batch_number, expiry_date, last_restocked_at"),
            ("purchase_orders", "po_id (PK), branch_id (FK), supplier_id (FK), po_date, total_amount, status"),
            ("purchase_order_items", "po_item_id (PK), po_id (FK), product_id (FK), quantity, unit_cost, subtotal"),
            ("low_stock_alerts", "alert_id (PK), branch_id (FK), product_id (FK), current_stock, reorder_level, is_resolved"),
        ]),
        ("Transactions & Analytics", RGBColor(217, 119, 6), [
            ("customers", "customer_id (PK), first_name, last_name, phone, loyalty_points"),
            ("sales", "sale_id (PK), invoice_no (UQ), branch_id (FK), customer_id (FK), employee_id (FK), sale_date, total_amount, payment_method, prescription_no"),
            ("sale_items", "sale_item_id (PK), sale_id (FK), product_id (FK), quantity, unit_price, discount_pct, subtotal"),
            ("audit_logs", "log_id (PK), table_name, action, record_id, changed_by, old_values, new_values, timestamp"),
        ]),
    ]

    for idx, (title, color, tbls) in enumerate(clusters):
        left = Inches(0.8 + idx * 4.0)
        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, Inches(1.8), col_width, Inches(5.0))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = BORDER_LIGHT
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.2)
        
        p = tf.paragraphs[0]
        p.text = title.upper()
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = color
        p.space_after = Pt(12)

        for tname, attrs in tbls:
            p_t = tf.add_paragraph()
            p_t.text = f"• {tname}"
            p_t.font.bold = True
            p_t.font.size = Pt(11)
            p_t.font.color.rgb = TEXT_DARK
            
            p_a = tf.add_paragraph()
            p_a.text = attrs
            p_a.font.size = Pt(9)
            p_a.font.color.rgb = TEXT_MUTED
            p_a.space_after = Pt(8)

    # ==========================================
    # HELPER FUNCTION FOR QUERY SLIDES
    # ==========================================
    def create_query_slide(slide_num, title, category, query_no, sql_text, purpose, business_context, output_desc):
        s = prs.slides.add_slide(blank_layout)
        add_header(s, title, category, slide_num)
        add_footer(s)

        # Left Column: SQL Code Box (Dark Syntax Box)
        code_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(6.8), Inches(5.0))
        code_card.fill.solid()
        code_card.fill.fore_color.rgb = CODE_BG
        code_card.line.color.rgb = RGBColor(51, 65, 85)
        tf_code = code_card.text_frame
        tf_code.word_wrap = True
        tf_code.margin_left = tf_code.margin_right = tf_code.margin_top = Inches(0.25)

        p_badge = tf_code.paragraphs[0]
        p_badge.text = f"POSTGRESQL QUERY #{query_no}"
        p_badge.font.bold = True
        p_badge.font.size = Pt(10)
        p_badge.font.color.rgb = KEYWORD_COLOR
        p_badge.font.name = "Consolas"
        p_badge.space_after = Pt(8)

        p_sql = tf_code.add_paragraph()
        p_sql.text = sql_text.strip()
        p_sql.font.size = Pt(11)
        p_sql.font.color.rgb = CODE_TEXT
        p_sql.font.name = "Consolas"

        # Right Column: Technical & Business Explanation Card
        info_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.8), Inches(4.733), Inches(5.0))
        info_card.fill.solid()
        info_card.fill.fore_color.rgb = CARD_LIGHT
        info_card.line.color.rgb = BORDER_LIGHT
        tf_info = info_card.text_frame
        tf_info.word_wrap = True
        tf_info.margin_left = tf_info.margin_right = tf_info.margin_top = Inches(0.25)

        sections = [
            ("RELATIONAL PURPOSE", PRIMARY_INDIGO, purpose),
            ("PHARMACY BUSINESS LOGIC", ACCENT_TEAL, business_context),
            ("OUTPUT & RESULT SCHEMA", RGBColor(217, 119, 6), output_desc),
        ]

        for s_idx, (sec_title, sec_color, sec_body) in enumerate(sections):
            p_st = tf_info.paragraphs[0] if s_idx == 0 else tf_info.add_paragraph()
            p_st.text = sec_title
            p_st.font.bold = True
            p_st.font.size = Pt(11)
            p_st.font.color.rgb = sec_color
            p_st.font.name = "Segoe UI"
            p_st.space_after = Pt(2)

            p_sb = tf_info.add_paragraph()
            p_sb.text = sec_body
            p_sb.font.size = Pt(10.5)
            p_sb.font.color.rgb = TEXT_DARK
            p_sb.font.name = "Segoe UI"
            p_sb.space_after = Pt(14)

    # ==========================================
    # SLIDE 4: SIMPLE QUERIES 1 & 2
    # ==========================================
    create_query_slide(
        4,
        "Simple Queries: Multi-Table Inner Joins (Catalog & HR)",
        "Category 1: Simple Relational Queries",
        "1 & 2",
        """-- Query 1: Active Products Catalog with Category & Supplier
SELECT p.product_name, c.category_name, s.supplier_name, p.unit_price
FROM products p
JOIN categories c ON c.category_id = p.category_id
JOIN suppliers s ON s.supplier_id = p.supplier_id
WHERE p.is_active = TRUE
ORDER BY c.category_name, p.product_name;

-- Query 2: Branch HR & Staff Role Overview
SELECT b.branch_name, e.first_name || ' ' || e.last_name AS staff_name, 
       e.role, e.email, e.phone
FROM employees e
JOIN branches b ON b.branch_id = e.branch_id
WHERE e.is_active = TRUE
ORDER BY b.branch_name, e.role;""",
        "Demonstrates multi-table INNER JOIN operations resolving foreign keys between entities (products-categories-suppliers and employees-branches) with filtering and compound ordering.",
        "Query 1 powers the cashier catalog search displaying verified medicine names with registered drug categories and vendors. Query 2 provides headquarters with branch roster visibility.",
        "Query 1: (product_name, category_name, supplier_name, unit_price).\nQuery 2: (branch_name, staff_name, role, email, phone)."
    )

    # ==========================================
    # SLIDE 5: SIMPLE QUERIES 3 & 4
    # ==========================================
    create_query_slide(
        5,
        "Simple Queries: Date Arithmetic & Transaction Ledger",
        "Category 1: Simple Relational Queries",
        "3 & 4",
        """-- Query 3: Daily Stock & Days-to-Expiry Monitor
SELECT p.product_name, i.batch_number, i.quantity, i.expiry_date,
       (i.expiry_date - CURRENT_DATE) AS days_to_expiry
FROM inventory i
JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 1
ORDER BY days_to_expiry ASC;

-- Query 4: Daily Sales Transaction Ledger
SELECT s.invoice_no, b.branch_name, s.sale_date,
       COALESCE(c.first_name || ' ' || c.last_name, 'Walk-in') AS customer,
       s.total_amount, s.payment_method
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
LEFT JOIN customers c ON c.customer_id = s.customer_id
ORDER BY s.sale_date DESC;""",
        "Employs date subtraction `(expiry_date - CURRENT_DATE)` for temporal analytics and `LEFT JOIN` with `COALESCE` to support non-mandatory customer relationships (walk-in cash sales).",
        "Enforces the First-Expiry-First-Out (FEFO) dispensing protocol to eliminate pharmaceutical wastage before batch expiration. Query 4 feeds the financial audit log.",
        "Returns batch expiry urgency in days and real-time transaction billing details including payment method breakdown (CASH, UPI, CARD)."
    )

    # ==========================================
    # SLIDE 6: NESTED QUERIES (NOT IN & SUBQUERY)
    # ==========================================
    create_query_slide(
        6,
        "Nested Query: Dead Stock Identification (NOT IN Subquery)",
        "Category 2: Nested Subqueries",
        "6",
        """-- Query 6: Products That Have Never Appeared in Any Sale
SELECT p.product_id, p.product_name, p.brand, p.unit_price, p.cost_price
FROM products p
WHERE p.product_id NOT IN (
    SELECT DISTINCT si.product_id
    FROM sale_items si
)
AND p.is_active = TRUE
ORDER BY p.unit_price DESC;""",
        "Subquery evaluation: The inner query evaluates `SELECT DISTINCT product_id FROM sale_items`, creating an in-memory set of sold IDs. The outer query uses `NOT IN` to filter catalog records.",
        "Identifies 'Dead Stock'—medicines occupying physical shelf space without generating cash flow. Helps pharmacy general managers negotiate return-to-vendor terms or issue clearance promotions.",
        "Returns active products with zero historical sales transactions, highlighting capital locked in non-moving medicines."
    )

    # ==========================================
    # SLIDE 7: NESTED QUERIES (HAVING > AVG SUBQUERY)
    # ==========================================
    create_query_slide(
        7,
        "Nested Query: High-Value VIP Customers (HAVING > AVG)",
        "Category 2: Nested Subqueries",
        "7",
        """-- Query 7: Customers Spending More than the Average Customer Total
SELECT c.customer_id, c.first_name || ' ' || c.last_name AS customer_name,
       c.phone, c.loyalty_points,
       SUM(s.total_amount) AS total_spent
FROM customers c
JOIN sales s ON s.customer_id = c.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.phone, c.loyalty_points
HAVING SUM(s.total_amount) > (
    SELECT AVG(customer_total)
    FROM (
        SELECT SUM(total_amount) AS customer_total
        FROM sales
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
    ) sub
)
ORDER BY total_spent DESC;""",
        "Two-level subquery: The innermost query aggregates spending per customer; the middle query computes `AVG(customer_total)`; the outer query applies `HAVING SUM > AVG`.",
        "Identifies high-value chronic-care patients (e.g. cardiac, diabetic medications) eligible for automated pharmacy loyalty reward bonuses and refill reminder calls.",
        "Produces prioritized VIP customer records whose aggregate spend exceeds the company-wide customer benchmark."
    )

    # ==========================================
    # SLIDE 8: NESTED QUERIES (IN WITH AGGREGATE SUBQUERY)
    # ==========================================
    create_query_slide(
        8,
        "Nested Query: High Reorder Risk Branches (IN with Subquery)",
        "Category 2: Nested Subqueries",
        "8",
        """-- Query 8: Branches With Stock Below Company-Wide Reorder Benchmark
SELECT b.branch_id, b.branch_name, b.city, b.phone
FROM branches b
WHERE b.branch_id IN (
    SELECT DISTINCT i.branch_id
    FROM inventory i
    WHERE i.quantity < (
        SELECT AVG(reorder_level)
        FROM inventory
    )
)
AND b.is_active = TRUE
ORDER BY b.branch_name;""",
        "Demonstrates nested subquery with set membership: Evaluates the global average safety threshold across the chain and identifies branches stocking below this threshold.",
        "Enables automated central warehouse replenishment routing: headquarters flags entire locations at supply risk before individual medicine stockouts occur.",
        "Returns branch contact and location details for all pharmacies requiring emergency stock transfers from the central warehouse."
    )

    # ==========================================
    # SLIDE 9: SET OPERATIONS - UNION
    # ==========================================
    create_query_slide(
        9,
        "SET Operations: UNION (Cross-Branch Product Catalog)",
        "Category 3: Relational Set Operations",
        "11 & 12",
        """-- Query 11: Unique Products Available in Branch 1 OR Branch 2
SELECT p.product_id, p.product_name, p.brand, 'Branch 1' AS location
FROM inventory i JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 1
UNION
SELECT p.product_id, p.product_name, p.brand, 'Branch 2' AS location
FROM inventory i JOIN products p ON p.product_id = i.product_id
WHERE i.branch_id = 2
ORDER BY product_name;

-- Query 12: Unified Contact Directory (Customers + Suppliers)
SELECT phone, first_name || ' ' || last_name AS entity_name, 'Customer' AS contact_type 
FROM customers WHERE phone IS NOT NULL
UNION
SELECT phone, supplier_name AS entity_name, 'Supplier' AS contact_type 
FROM suppliers WHERE phone IS NOT NULL
ORDER BY entity_name;""",
        "Relational algebra union operator (R ∪ S). Eliminates duplicates and combines compatible tuples from disparate branches or distinct role entities into a unified relation.",
        "Query 11 gives regional managers a combined view of medicines stocked across neighboring branches. Query 12 unifies communication channels for pharmacy SMS broadcasting.",
        "Outputs consolidated, duplicate-free sets of products and verified 10-digit emergency telephone contacts."
    )

    # ==========================================
    # SLIDE 10: SET OPERATIONS - INTERSECT
    # ==========================================
    create_query_slide(
        10,
        "SET Operations: INTERSECT (Shared High-Demand Products)",
        "Category 3: Relational Set Operations",
        "13 & 14",
        """-- Query 13: Products Actively Sold at BOTH Branch 1 AND Branch 2
SELECT p.product_id, p.product_name, p.brand
FROM products p
WHERE p.product_id IN (
    SELECT si.product_id
    FROM sale_items si JOIN sales s ON s.sale_id = si.sale_id
    WHERE s.branch_id = 1
    INTERSECT
    SELECT si.product_id
    FROM sale_items si JOIN sales s ON s.sale_id = si.sale_id
    WHERE s.branch_id = 2
)
ORDER BY p.product_name;

-- Query 14: Shared Suppliers Serving Both Locations
SELECT supplier_id FROM purchase_orders WHERE branch_id = 1
INTERSECT
SELECT supplier_id FROM purchase_orders WHERE branch_id = 2;""",
        "Relational algebra intersection operator (R ∩ S). Returns only the tuples present in both branch transaction domains simultaneously.",
        "Identifies universal high-velocity medicines (e.g. Paracetamol, Cetirizine) that perform consistently across urban and suburban demographics, supporting bulk volume procurement discounts.",
        "Returns product IDs and names that have recorded sales at both distinct branch physical locations."
    )

    # ==========================================
    # SLIDE 11: SET OPERATIONS - EXCEPT
    # ==========================================
    create_query_slide(
        11,
        "SET Operations: EXCEPT (Branch-Exclusive Inventory)",
        "Category 3: Relational Set Operations",
        "15 & 16",
        """-- Query 15: Products Stocked at Branch 1 but NOT at Branch 2
SELECT p.product_id, p.product_name, p.brand, p.unit_price
FROM products p
WHERE p.product_id IN (
    SELECT product_id FROM inventory WHERE branch_id = 1
    EXCEPT
    SELECT product_id FROM inventory WHERE branch_id = 2
)
ORDER BY p.product_name;

-- Query 16: Catalog Medicines with No Purchase Orders
SELECT product_id, product_name FROM products WHERE is_active = TRUE
EXCEPT
SELECT p.product_id, p.product_name
FROM products p
JOIN purchase_order_items poi ON p.product_id = poi.product_id;""",
        "Relational algebra set difference operator (R - S). Identifies tuples present in the primary relation that are absent from the secondary relation.",
        "Pinpoints inventory assortment imbalances: if Branch 2 receives customer prescriptions for medicines stocked only at Branch 1, logistics can initiate inter-branch transfer orders.",
        "Lists products stocked exclusively at the main hospital branch that need supply onboarding at satellite pharmacy counters."
    )

    # ==========================================
    # SLIDE 12: GROUP BY & HAVING - FINANCIAL AGGREGATIONS
    # ==========================================
    create_query_slide(
        12,
        "GROUP BY & HAVING: Branch Revenue & High-Performance Filter",
        "Category 4: Aggregation & Grouping",
        "17 & 19",
        """-- Query 17: Monthly Sales Revenue Breakdown per Branch
SELECT b.branch_name,
       DATE_TRUNC('month', s.sale_date) AS sales_month,
       COUNT(s.sale_id) AS total_invoices,
       SUM(s.total_amount) AS gross_revenue,
       ROUND(AVG(s.total_amount), 2) AS avg_invoice_value
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
GROUP BY b.branch_name, DATE_TRUNC('month', s.sale_date)
ORDER BY sales_month DESC, gross_revenue DESC;

-- Query 19: High-Performing Branches (Revenue > ₹50,000)
SELECT b.branch_name, b.city,
       COUNT(s.sale_id) AS transaction_count,
       SUM(s.total_amount) AS total_revenue
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
GROUP BY b.branch_name, b.city
HAVING SUM(s.total_amount) > 50000
ORDER BY total_revenue DESC;""",
        "Combines multi-column `GROUP BY` with aggregate functions (`COUNT`, `SUM`, `AVG`) and `HAVING` predicate filter applied after relation partitioning.",
        "Produces executive monthly P&L summaries. The `HAVING` clause filters out nascent or underperforming branches, spotlighting tier-1 revenue drivers.",
        "Returns partitioned financial metrics: month, total billed invoices, aggregate INR revenue, and mean basket size."
    )

    # ==========================================
    # SLIDE 13: GROUP BY & HAVING - FAST-MOVING MEDICINES
    # ==========================================
    create_query_slide(
        13,
        "GROUP BY & HAVING: Fast-Moving Pharmaceuticals",
        "Category 4: Aggregation & Grouping",
        "18 & 20",
        """-- Query 18 & 20: Medicines Sold > 10 Units Across Branches
SELECT p.product_id, p.product_name, p.brand, c.category_name,
       SUM(si.quantity) AS total_units_sold,
       SUM(si.subtotal) AS total_sales_volume,
       COUNT(DISTINCT s.sale_id) AS invoice_count
FROM sale_items si
JOIN products p ON p.product_id = si.product_id
JOIN categories c ON c.category_id = p.category_id
JOIN sales s ON s.sale_id = si.sale_id
GROUP BY p.product_id, p.product_name, p.brand, c.category_name
HAVING SUM(si.quantity) > 10
ORDER BY total_units_sold DESC;""",
        "Aggregates granular invoice item tuples across sales transactions and applies post-aggregation `HAVING` filter on total unit velocity.",
        "Forms the basis for the ABC Inventory Classification method: ensures top-selling fast movers never face stockouts due to high inventory turnover.",
        "Lists medicine codes, brands, category classifications, and total units dispensed across the entire pharmacy network."
    )

    # ==========================================
    # SLIDE 14: PATTERN MATCHING & RANGE FILTERING
    # ==========================================
    create_query_slide(
        14,
        "Pattern Matching & Range Filtering: LIKE & BETWEEN",
        "Category 5: Pattern Matching & Intervals",
        "21, 22 & 23",
        """-- Query 21: Case-Insensitive Prefix Search (LIKE / ILIKE)
SELECT product_id, medicine_code, product_name, brand, unit_price
FROM products
WHERE product_name ILIKE 'Para%' AND is_active = TRUE;

-- Query 22: Recent 7-Day Sales Audit (BETWEEN with Dynamic Interval)
SELECT s.invoice_no, b.branch_name, s.sale_date, s.total_amount
FROM sales s
JOIN branches b ON b.branch_id = s.branch_id
WHERE s.sale_date BETWEEN NOW() - INTERVAL '7 days' AND NOW()
ORDER BY s.sale_date DESC;

-- Query 23: Price Bracket Filtering (BETWEEN Operator)
SELECT product_name, brand, unit_price, drug_schedule
FROM products
WHERE unit_price BETWEEN 50.00 AND 500.00 AND is_active = TRUE
ORDER BY unit_price ASC;""",
        "Utilizes SQL pattern matching (`ILIKE` for case-insensitive B-Tree index scans) and `BETWEEN` range predicates over numeric and timestamp domains.",
        "Powers responsive autocomplete in the billing UI, generates rolling weekly GST reconciliation audits, and categorizes products into patient affordability tiers.",
        "Demonstrates precise boundary inclusion `[min, max]` in SQL without requiring verbose `>= AND <=` logic."
    )

    # ==========================================
    # SLIDE 15: ADVANCED CORRELATED SUBQUERY
    # ==========================================
    create_query_slide(
        15,
        "Correlated Subquery: Cross-Branch Sales Matrix",
        "Category 6: Advanced Analytics (Phase 2)",
        "9 (Correlated)",
        """-- Correlated Subquery: Sales Volume per Product Evaluated per Branch
SELECT p.product_name, b.branch_name,
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
ORDER BY p.product_name, b.branch_name;""",
        "True Correlated Subquery: The inner query references `p.product_id` and `b.branch_id` from the outer `CROSS JOIN` query, re-executing for each outer tuple pair.",
        "Generates a multi-branch sales distribution matrix, highlighting regional demand variations (e.g. antibiotic sales near general hospitals vs pediatric syrups in suburbs).",
        "Yields a 2D matrix of (product, branch, total_units_sold) containing explicit zeroes for branches where a product had no transactions."
    )

    # ==========================================
    # SLIDE 16: EXISTS & NOT EXISTS
    # ==========================================
    create_query_slide(
        16,
        "Subquery Operators: EXISTS & NOT EXISTS",
        "Category 6: Advanced Analytics (Phase 2)",
        "5 & 24",
        """-- Query 5 (EXISTS): Branches With Active Unresolved Low-Stock Alerts
SELECT b.branch_id, b.branch_name, b.city, b.phone
FROM branches b
WHERE EXISTS (
    SELECT 1
    FROM low_stock_alerts la
    WHERE la.branch_id = b.branch_id
      AND la.is_resolved = FALSE
)
AND b.is_active = TRUE;

-- Query 24 (NOT EXISTS): Suppliers Without Any Purchase Orders
SELECT s.supplier_id, s.supplier_name, s.city, s.phone
FROM suppliers s
WHERE NOT EXISTS (
    SELECT 1
    FROM purchase_orders po
    WHERE po.supplier_id = s.supplier_id
)
AND s.is_active = TRUE;""",
        "Boolean existence quantifier. PostgreSQL short-circuits evaluation upon detecting the first matching tuple in the subquery, offering higher performance than `COUNT(*) > 0`.",
        "Powers the automated alert badge on the navigation bar (triggering urgent warning lights if any alert exists) and cleans up inactive vendor records.",
        "Returns branch and vendor entities filtered dynamically by live operational conditions."
    )

    # ==========================================
    # SLIDE 17: PRE-COMPUTED DATABASE VIEWS (2 VIEWS)
    # ==========================================
    s17 = prs.slides.add_slide(blank_layout)
    add_header(s17, "Database Views: Abstraction & Live Reporting", "Phase 2 Deliverable: 2 Views", 17)
    add_footer(s17)

    # View 1 Card
    v1 = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    v1.fill.solid()
    v1.fill.fore_color.rgb = CARD_LIGHT
    v1.line.color.rgb = BORDER_LIGHT
    tf_v1 = v1.text_frame
    tf_v1.word_wrap = True
    tf_v1.margin_left = tf_v1.margin_right = tf_v1.margin_top = Inches(0.2)

    p = tf_v1.paragraphs[0]
    p.text = "VIEW 1: v_branch_sales_summary"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(8)

    p_sql1 = tf_v1.add_paragraph()
    p_sql1.text = """CREATE VIEW v_branch_sales_summary AS
SELECT 
    b.branch_id, b.branch_name, b.city,
    COUNT(s.sale_id) AS total_transactions,
    COALESCE(SUM(s.total_amount), 0) AS total_revenue,
    ROUND(COALESCE(AVG(s.total_amount), 0), 2) AS avg_transaction_value,
    MAX(s.sale_date) AS last_sale_date
FROM branches b
LEFT JOIN sales s ON s.branch_id = b.branch_id
WHERE b.is_active = TRUE
GROUP BY b.branch_id, b.branch_name, b.city;"""
    p_sql1.font.size = Pt(9.5)
    p_sql1.font.name = "Consolas"
    p_sql1.font.color.rgb = CODE_BG
    p_sql1.space_after = Pt(10)

    p_desc1 = tf_v1.add_paragraph()
    p_desc1.text = "• Purpose: Encapsulates complex financial aggregations behind a secure, clean virtual table.\n• Usage: Powers GM analytics cards and report exports with zero code duplication."
    p_desc1.font.size = Pt(10)
    p_desc1.font.color.rgb = TEXT_DARK

    # View 2 Card
    v2 = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.833), Inches(1.8), Inches(5.7), Inches(5.0))
    v2.fill.solid()
    v2.fill.fore_color.rgb = CARD_LIGHT
    v2.line.color.rgb = BORDER_LIGHT
    tf_v2 = v2.text_frame
    tf_v2.word_wrap = True
    tf_v2.margin_left = tf_v2.margin_right = tf_v2.margin_top = Inches(0.2)

    p = tf_v2.paragraphs[0]
    p.text = "VIEW 2: v_inventory_status"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(8)

    p_sql2 = tf_v2.add_paragraph()
    p_sql2.text = """CREATE VIEW v_inventory_status AS
SELECT 
    i.branch_id, b.branch_name,
    p.product_id, p.product_name, p.brand,
    i.quantity AS current_qty, i.reorder_level,
    (i.expiry_date - CURRENT_DATE) AS days_to_expiry,
    CASE 
        WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
        WHEN i.quantity <= i.reorder_level THEN 'LOW_STOCK'
        WHEN i.expiry_date - CURRENT_DATE < 30 THEN 'NEAR_EXPIRY'
        ELSE 'OK'
    END AS stock_status,
    GREATEST(0, (i.reorder_level * 2) - i.quantity) AS recommended_reorder_qty
FROM inventory i
JOIN products p ON p.product_id = i.product_id
JOIN branches b ON b.branch_id = i.branch_id;"""
    p_sql2.font.size = Pt(9.0)
    p_sql2.font.name = "Consolas"
    p_sql2.font.color.rgb = CODE_BG
    p_sql2.space_after = Pt(10)

    p_desc2 = tf_v2.add_paragraph()
    p_desc2.text = "• Purpose: Dynamic multi-branch inventory health monitor with automated status categorization.\n• Usage: Drives the real-time stock alert badges and restock recommendation engine in the React SPA."
    p_desc2.font.size = Pt(10)
    p_desc2.font.color.rgb = TEXT_DARK

    # ==========================================
    # SLIDE 18: DATABASE TRIGGERS (2 TRIGGERS)
    # ==========================================
    s18 = prs.slides.add_slide(blank_layout)
    add_header(s18, "Database Triggers: Automated Integrity Enforcement", "Phase 2 Deliverable: 2 Triggers", 18)
    add_footer(s18)

    # Trigger 1 Card
    tr1 = s18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    tr1.fill.solid()
    tr1.fill.fore_color.rgb = CARD_LIGHT
    tr1.line.color.rgb = BORDER_LIGHT
    tf_tr1 = tr1.text_frame
    tf_tr1.word_wrap = True
    tf_tr1.margin_left = tf_tr1.margin_right = tf_tr1.margin_top = Inches(0.2)

    p = tf_tr1.paragraphs[0]
    p.text = "TRIGGER 1: trg_sale_items_reduce_stock"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(6)

    p_t1 = tf_tr1.add_paragraph()
    p_t1.text = """CREATE OR REPLACE FUNCTION fn_reduce_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE v_branch_id INT;
BEGIN
    SELECT branch_id INTO v_branch_id FROM sales WHERE sale_id = NEW.sale_id;
    
    UPDATE inventory 
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE branch_id = v_branch_id AND product_id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sale_items_reduce_stock
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION fn_reduce_stock_on_sale();"""
    p_t1.font.size = Pt(9.0)
    p_t1.font.name = "Consolas"
    p_t1.font.color.rgb = CODE_BG
    p_t1.space_after = Pt(8)

    p_d1 = tf_tr1.add_paragraph()
    p_d1.text = "• Event: AFTER INSERT ON sale_items\n• Action: Automatically decrements branch stock as items are scanned at counter. Guarantees consistency even if raw SQL is executed directly."
    p_d1.font.size = Pt(9.5)
    p_d1.font.color.rgb = TEXT_DARK

    # Trigger 2 Card
    tr2 = s18.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.833), Inches(1.8), Inches(5.7), Inches(5.0))
    tr2.fill.solid()
    tr2.fill.fore_color.rgb = CARD_LIGHT
    tr2.line.color.rgb = BORDER_LIGHT
    tf_tr2 = tr2.text_frame
    tf_tr2.word_wrap = True
    tf_tr2.margin_left = tf_tr2.margin_right = tf_tr2.margin_top = Inches(0.2)

    p = tf_tr2.paragraphs[0]
    p.text = "TRIGGER 2: trg_low_stock_alert"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ALERT_RED
    p.space_after = Pt(6)

    p_t2 = tf_tr2.add_paragraph()
    p_t2.text = """CREATE OR REPLACE FUNCTION fn_check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity <= NEW.reorder_level AND 
       (OLD.quantity > OLD.reorder_level OR TG_OP = 'INSERT') THEN
        INSERT INTO low_stock_alerts (
            branch_id, product_id, current_stock, 
            reorder_level, alert_time, is_resolved
        )
        VALUES (
            NEW.branch_id, NEW.product_id, NEW.quantity, 
            NEW.reorder_level, NOW(), FALSE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_stock_alert
AFTER UPDATE OF quantity ON inventory
FOR EACH ROW EXECUTE FUNCTION fn_check_low_stock();"""
    p_t2.font.size = Pt(8.5)
    p_t2.font.name = "Consolas"
    p_t2.font.color.rgb = CODE_BG
    p_t2.space_after = Pt(8)

    p_d2 = tf_tr2.add_paragraph()
    p_d2.text = "• Event: AFTER UPDATE OF quantity ON inventory\n• Action: Detects when stock crosses below safety threshold and automatically generates unresolved alert tickets for procurement."
    p_d2.font.size = Pt(9.5)
    p_d2.font.color.rgb = TEXT_DARK

    # ==========================================
    # SLIDE 19: STORED PROCEDURES & CONCURRENCY
    # ==========================================
    s19 = prs.slides.add_slide(blank_layout)
    add_header(s19, "Stored Procedures & Multi-Branch Concurrency Control", "Phase 2 Deliverable: 2 Procedures", 19)
    add_footer(s19)

    # Left: process_sale
    sp1 = s19.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(6.8), Inches(5.0))
    sp1.fill.solid()
    sp1.fill.fore_color.rgb = CODE_BG
    sp1.line.color.rgb = RGBColor(51, 65, 85)
    tf_sp1 = sp1.text_frame
    tf_sp1.word_wrap = True
    tf_sp1.margin_left = tf_sp1.margin_right = tf_sp1.margin_top = Inches(0.2)

    p = tf_sp1.paragraphs[0]
    p.text = "STORED PROCEDURE: process_sale (PESSIMISTIC ROW LOCKING)"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = KEYWORD_COLOR
    p.space_after = Pt(6)

    p_code = tf_sp1.add_paragraph()
    p_code.text = """CREATE OR REPLACE PROCEDURE process_sale(
    p_branch_id INT, p_employee_id INT, p_customer_id INT,
    p_payment_method VARCHAR, p_discount NUMERIC,
    p_prescription_no VARCHAR, p_notes TEXT,
    p_items JSONB, INOUT p_sale_id INT DEFAULT NULL,
    INOUT p_invoice_no VARCHAR DEFAULT NULL
) LANGUAGE plpgsql AS $$
DECLARE ...
BEGIN
    -- 1. Acquire exclusive row lock on targeted inventory tuple
    FOR r IN SELECT * FROM jsonb_to_recordset(p_items) ... LOOP
        SELECT i.quantity, p.product_name INTO v_current_qty, v_product_name
        FROM inventory i JOIN products p ON p.product_id = i.product_id
        WHERE i.branch_id = p_branch_id AND i.product_id = v_product_id
        FOR UPDATE OF i;  -- <== ROW-LEVEL PESSIMISTIC LOCK

        IF v_current_qty < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock: % at branch %', v_product_name, p_branch_id;
        END IF;
    END LOOP;
    -- 2. Insert Invoice Header, Line Items, and Commit Atomically
    ...
END; $$;"""
    p_code.font.size = Pt(9.5)
    p_code.font.name = "Consolas"
    p_code.font.color.rgb = CODE_TEXT

    # Right: Concurrency Architecture Explanation
    sp2 = s19.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.8), Inches(1.8), Inches(4.733), Inches(5.0))
    sp2.fill.solid()
    sp2.fill.fore_color.rgb = CARD_LIGHT
    sp2.line.color.rgb = BORDER_LIGHT
    tf_sp2 = sp2.text_frame
    tf_sp2.word_wrap = True
    tf_sp2.margin_left = tf_sp2.margin_right = tf_sp2.margin_top = Inches(0.25)

    p = tf_sp2.paragraphs[0]
    p.text = "ACID CONCURRENCY ARCHITECTURE"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(10)

    points = [
        ("Row-Level Locking (FOR UPDATE):", "Serializes concurrent checkout requests on the same medicine at the same counter, completely preventing overselling/negative stock."),
        ("Atomic Rollback:", "If even one item in a 10-medicine prescription has insufficient stock, PostgreSQL aborts the entire transaction without writing partial bills."),
        ("Multi-Branch Independence:", "Because inventory uses composite primary key `(branch_id, product_id)`, Branch 1 and Branch 2 lock separate physical heap rows, operating in full parallel throughput with zero contention."),
        ("Restock Procedure:", "`restock_inventory(...)` replenishes batch units and automatically logs to the audit ledger."),
    ]
    for h, b in points:
        p_h = tf_sp2.add_paragraph()
        p_h.text = f"• {h}"
        p_h.font.bold = True
        p_h.font.size = Pt(10.5)
        p_h.font.color.rgb = TEXT_DARK
        
        p_b = tf_sp2.add_paragraph()
        p_b.text = b
        p_b.font.size = Pt(9.5)
        p_b.font.color.rgb = TEXT_MUTED
        p_b.space_after = Pt(6)

    # ==========================================
    # SLIDE 20: DML OPERATIONS (UPDATE & DELETE)
    # ==========================================
    s20 = prs.slides.add_slide(blank_layout)
    add_header(s20, "Data Manipulation Language: UPDATE & DELETE with RETURNING", "DML Operations", 20)
    add_footer(s20)

    # Left: UPDATE Queries
    u_card = s20.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    u_card.fill.solid()
    u_card.fill.fore_color.rgb = CARD_LIGHT
    u_card.line.color.rgb = BORDER_LIGHT
    tf_u = u_card.text_frame
    tf_u.word_wrap = True
    tf_u.margin_left = tf_u.margin_right = tf_u.margin_top = Inches(0.2)

    p = tf_u.paragraphs[0]
    p.text = "DML UPDATE OPERATIONS"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(8)

    p_sql_u = tf_u.add_paragraph()
    p_sql_u.text = """-- 1. 5% Inflation Revision on OTC Category
UPDATE products
SET unit_price = ROUND(unit_price * 1.05, 2)
WHERE category_id = 1
RETURNING product_id, product_name, unit_price;

-- 2. Dynamic Safety Threshold Adjustment
UPDATE inventory
SET reorder_level = 25
WHERE quantity > 30
RETURNING branch_id, product_id, reorder_level;

-- 3. Batch Quality Control Prefixing
UPDATE inventory
SET batch_number = 'QC-' || batch_number
WHERE batch_number NOT LIKE 'QC-%' AND branch_id = 1
RETURNING branch_id, product_id, batch_number;"""
    p_sql_u.font.size = Pt(9.0)
    p_sql_u.font.name = "Consolas"
    p_sql_u.font.color.rgb = CODE_BG
    p_sql_u.space_after = Pt(8)

    p_du = tf_u.add_paragraph()
    p_du.text = "• Feature: PostgreSQL `RETURNING` clause returns modified tuples immediately without secondary query roundtrip.\n• Live in Query Explorer & Inventory CRUD forms."
    p_du.font.size = Pt(9.5)
    p_du.font.color.rgb = TEXT_DARK

    # Right: DELETE Queries
    d_card = s20.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.833), Inches(1.8), Inches(5.7), Inches(5.0))
    d_card.fill.solid()
    d_card.fill.fore_color.rgb = CARD_LIGHT
    d_card.line.color.rgb = BORDER_LIGHT
    tf_d = d_card.text_frame
    tf_d.word_wrap = True
    tf_d.margin_left = tf_d.margin_right = tf_d.margin_top = Inches(0.2)

    p = tf_d.paragraphs[0]
    p.text = "DML DELETE OPERATIONS"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ALERT_RED
    p.space_after = Pt(8)

    p_sql_d = tf_d.add_paragraph()
    p_sql_d.text = """-- 1. Maintenance Purge of Resolved Alerts
DELETE FROM low_stock_alerts
WHERE is_resolved = TRUE
RETURNING alert_id, branch_id, current_stock;

-- 2. Depleted Stock Removal with Subquery Guard
DELETE FROM inventory
WHERE quantity = 0
  AND NOT EXISTS (
      SELECT 1 FROM sale_items si 
      WHERE si.product_id = inventory.product_id
  )
RETURNING branch_id, product_id, quantity;

-- 3. Soft Deactivation of Product
UPDATE products 
SET is_active = FALSE 
WHERE product_id = 12;"""
    p_sql_d.font.size = Pt(9.0)
    p_sql_d.font.name = "Consolas"
    p_sql_d.font.color.rgb = CODE_BG
    p_sql_d.space_after = Pt(8)

    p_dd = tf_d.add_paragraph()
    p_dd.text = "• Referential Integrity Protection: Foreign key RESTRICT prevents accidental orphan cascades in transaction tables.\n• Supports both physical purging and soft-deletion."
    p_dd.font.size = Pt(9.5)
    p_dd.font.color.rgb = TEXT_DARK

    # ==========================================
    # SLIDE 21: FRONTEND USER INTERFACE & 5 FORMS
    # ==========================================
    s21 = prs.slides.add_slide(blank_layout)
    add_header(s21, "Frontend Implementation: 5 Forms & Live Navigation", "Phase 2 Deliverable: React UI", 21)
    add_footer(s21)

    forms = [
        ("1. Main Analytics Dashboard", "Overview View (`/overview`)", "Executive KPIs, sales revenue trends, branch comparison chart, low stock badges, and rapid navigation shortcuts."),
        ("2. POS Billing Cart Form", "Point of Sale View (`/billing`)", "Product catalog search, category chips, 1-click test billing presets, live cart subtotals, GST tax calculation, and Schedule H prescription gating."),
        ("3. Stock Data Entry & Restock Modal", "Inventory View (`/inventory`)", "Add New Stock Record form (`POST`), Update Reorder Threshold (`PUT`), and Restock Modal (`+10, +25, +50, +100`) via stored procedure."),
        ("4. Branch Management Form", "Branches View (`/branches`)", "Create and edit retail branch locations, manage store contact info, GSTIN registrations, and store manager assignments."),
        ("5. Live SQL Console & Query Explorer", "Query Explorer (`/queries`)", "Run all 10 course baseline query categories live, inspect returned tuples, or execute custom interactive SQL queries with safety guards."),
    ]

    for idx, (fname, fview, fdesc) in enumerate(forms):
        top = Inches(1.8 + idx * 1.0)
        card = s21.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, Inches(11.733), Inches(0.85))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = BORDER_LIGHT
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.12)

        p = tf.paragraphs[0]
        p.text = f"{fname}  —  "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = PRIMARY_INDIGO

        # Append view name
        run = p.add_run()
        run.text = f"[{fview}]: "
        run.font.bold = True
        run.font.color.rgb = ACCENT_TEAL
        run.font.size = Pt(10)

        # Append description
        run2 = p.add_run()
        run2.text = fdesc
        run2.font.bold = False
        run2.font.color.rgb = TEXT_DARK
        run2.font.size = Pt(10)

    # ==========================================
    # SLIDE 22: TWO REPORT GENERATION DELIVERABLES
    # ==========================================
    s22 = prs.slides.add_slide(blank_layout)
    add_header(s22, "Report Generation: 2 Executive Management Reports", "Phase 2 Deliverable: Reporting", 22)
    add_footer(s22)

    # Report 1 Card
    r1 = s22.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    r1.fill.solid()
    r1.fill.fore_color.rgb = CARD_LIGHT
    r1.line.color.rgb = BORDER_LIGHT
    tf_r1 = r1.text_frame
    tf_r1.word_wrap = True
    tf_r1.margin_left = tf_r1.margin_right = tf_r1.margin_top = Inches(0.25)

    p = tf_r1.paragraphs[0]
    p.text = "REPORT 1: BRANCH SALES & PERFORMANCE AUDIT"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(10)

    items_r1 = [
        ("Data Source:", "Database View `v_branch_sales_summary` + `sales` transaction ledger."),
        ("Key Metrics:", "Branch transaction counts, Gross Revenue (INR), Average Basket Size, Last Active Transaction Timestamp."),
        ("Business Insight:", "Identifies top revenue generating branches vs underperforming regional counters for staffing allocation."),
        ("UI Feature:", "Exportable report view in React with real-time refresh and date window filtering."),
    ]
    for h, b in items_r1:
        p = tf_r1.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # Report 2 Card
    r2 = s22.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.833), Inches(1.8), Inches(5.7), Inches(5.0))
    r2.fill.solid()
    r2.fill.fore_color.rgb = CARD_LIGHT
    r2.line.color.rgb = BORDER_LIGHT
    tf_r2 = r2.text_frame
    tf_r2.word_wrap = True
    tf_r2.margin_left = tf_r2.margin_right = tf_r2.margin_top = Inches(0.25)

    p = tf_r2.paragraphs[0]
    p.text = "REPORT 2: EXPIRY & INVENTORY HEALTH AUDIT"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(10)

    items_r2 = [
        ("Data Source:", "Database View `v_inventory_status` + `low_stock_alerts` table."),
        ("Key Metrics:", "Current Available Quantity, Safety Reorder Threshold, Days to Expiry, Automated Health Status Tag (`OK`, `LOW_STOCK`, `NEAR_EXPIRY`, `OUT_OF_STOCK`), Recommended Reorder Units."),
        ("Business Insight:", "Enforces First-Expiry-First-Out dispensing; triggers procurement purchase orders before critical medicines deplete."),
        ("UI Feature:", "Interactive multi-branch stock filtering by location and critical status tag."),
    ]
    for h, b in items_r2:
        p = tf_r2.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # ==========================================
    # SLIDE 23: ROLE-BASED ACCESS CONTROL (RBAC)
    # ==========================================
    s23 = prs.slides.add_slide(blank_layout)
    add_header(s23, "Role-Based Access Control & Security Architecture", "Security & Multi-Tenancy", 23)
    add_footer(s23)

    # 2 Column Comparison: General Manager vs Branch Manager
    c_gm = s23.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(5.7), Inches(5.0))
    c_gm.fill.solid()
    c_gm.fill.fore_color.rgb = CARD_LIGHT
    c_gm.line.color.rgb = BORDER_LIGHT
    tf_gm = c_gm.text_frame
    tf_gm.word_wrap = True
    tf_gm.margin_left = tf_gm.margin_right = tf_gm.margin_top = Inches(0.25)

    p = tf_gm.paragraphs[0]
    p.text = "ROLE: GENERAL MANAGER (`GENERAL_MANAGER`)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = PRIMARY_INDIGO
    p.space_after = Pt(10)

    gm_points = [
        ("Scope:", "Global chain-wide administrative control across all branches."),
        ("Permissions:", "View aggregated cross-branch analytics, modify product catalog pricing, create/deactivate branch stores, oversee vendor purchase orders."),
        ("Demo Account:", "`gm@medmart.in` / `manager123`"),
        ("Token Binding:", "JWT payload embeds `role: 'GENERAL_MANAGER'` and unrestricted branch access."),
    ]
    for h, b in gm_points:
        p = tf_gm.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    c_bm = s23.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.833), Inches(1.8), Inches(5.7), Inches(5.0))
    c_bm.fill.solid()
    c_bm.fill.fore_color.rgb = CARD_LIGHT
    c_bm.line.color.rgb = BORDER_LIGHT
    tf_bm = c_bm.text_frame
    tf_bm.word_wrap = True
    tf_bm.margin_left = tf_bm.margin_right = tf_bm.margin_top = Inches(0.25)

    p = tf_bm.paragraphs[0]
    p.text = "ROLE: BRANCH MANAGER (`BRANCH_MANAGER`)"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = ACCENT_TEAL
    p.space_after = Pt(10)

    bm_points = [
        ("Scope:", "Strictly partitioned to the assigned physical branch location."),
        ("Permissions:", "Create sales invoices at counter, view only branch-specific inventory, trigger local stock restocks."),
        ("Security Enforcement:", "Enforced directly in FastAPI backend dependencies using claims extracted from cryptographic JWT—client branch IDs are rejected if mismatched (HTTP 403 Forbidden)."),
        ("Demo Account:", "`branch1@medmart.in` / `branch123` (Bound to Branch 1)."),
    ]
    for h, b in bm_points:
        p = tf_bm.add_paragraph()
        p.text = f"• {h} {b}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # ==========================================
    # SLIDE 24: TEST SUITE & VERIFICATION RESULTS
    # ==========================================
    s24 = prs.slides.add_slide(blank_layout)
    add_header(s24, "Automated Verification & Pytest Test Suite Results", "Quality Assurance", 24)
    add_footer(s24)

    card_t = s24.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.733), Inches(5.0))
    card_t.fill.solid()
    card_t.fill.fore_color.rgb = CARD_LIGHT
    card_t.line.color.rgb = BORDER_LIGHT
    tf_t = card_t.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = tf_t.margin_right = tf_t.margin_top = Inches(0.25)

    p = tf_t.paragraphs[0]
    p.text = "100% PASSING TEST SUITE (39 OUT OF 39 TESTS PASSED)"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = SUCCESS_GREEN
    p.space_after = Pt(12)

    test_groups = [
        ("Schema & Integrity (7 tests):", "Validates primary keys, foreign keys, cascade safety, and unique medicine code constraints (`tests/test_schema.py`, `test_database.py`)."),
        ("Stored Procedures & Concurrency (4 tests):", "Verifies multi-item invoice generation, duplicate line rejection, `FOR UPDATE` stock locking, and insufficient stock rollback (`test_procedures.py`, `test_concurrency.py`)."),
        ("Triggers & Views (4 tests):", "Validates automatic stock reduction trigger, low-stock alert ticket creation, and views readback (`test_triggers.py`, `test_views.py`)."),
        ("SQL Query Suite (9 tests):", "Executes all 10 query types against real PostgreSQL data: UNION, INTERSECT, EXCEPT, GROUP BY, HAVING, LIKE, BETWEEN, Correlated (`test_queries.py`)."),
        ("API & RBAC Authorization (15 tests):", "Tests branch isolation, HTTP 403 enforcement, inventory CRUD, POS billing, and JWT authentication (`test_auth.py`, `test_api_sales.py`, `test_sales_inventory_api.py`)."),
    ]
    for h, b in test_groups:
        p = tf_t.add_paragraph()
        p.text = f"✔ {h} {b}"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_DARK
        p.space_after = Pt(8)

    # ==========================================
    # SLIDE 25: VIVA VOCE DEFENSE QUESTIONS & ANSWERS
    # ==========================================
    s25 = prs.slides.add_slide(blank_layout)
    add_header(s25, "Key Viva Voce Technical Defense Points", "Viva Preparation", 25)
    add_footer(s25)

    qas = [
        ("Q1: Why did you choose Composite Primary Key (branch_id, product_id) for inventory?", 
         "A1: It mirrors physical reality: Paracetamol can exist at Branch 1 and Branch 2 simultaneously. Furthermore, in PostgreSQL, it creates discrete heap tuples allowing concurrent branch sales with zero lock contention."),
        ("Q2: How does the system prevent overselling under high concurrency?", 
         "A2: The `process_sale` stored procedure issues `SELECT ... FOR UPDATE` on the specific inventory tuple, acquiring a pessimistic row lock. Concurrent checkouts wait in line; if stock runs out, it raises an exception and rolls back atomically."),
        ("Q3: What is the difference between WHERE and HAVING in your project?", 
         "A3: `WHERE` filters raw rows before grouping (e.g. `WHERE is_active = TRUE`). `HAVING` filters aggregated buckets after `GROUP BY` (e.g. `HAVING SUM(s.total_amount) > 50000`)."),
        ("Q4: Why implement both a Trigger and a Stored Procedure for sales?", 
         "A4: Defense-in-depth: The stored procedure handles multi-item atomic validation, pricing, and locking. The trigger acts as an immutable database constraint ensuring that even if an ad-hoc SQL query inserts a sale_item, stock decrements automatically."),
    ]

    for idx, (q, a) in enumerate(qas):
        top = Inches(1.8 + idx * 1.25)
        card = s25.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, Inches(11.733), Inches(1.1))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_LIGHT
        card.line.color.rgb = BORDER_LIGHT
        tf = card.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = Inches(0.2)
        tf.margin_top = Inches(0.1)

        p = tf.paragraphs[0]
        p.text = q
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = PRIMARY_INDIGO
        p.space_after = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = a
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_DARK

    # ==========================================
    # SLIDE 26: CONCLUSION & DEMO WALKTHROUGH
    # ==========================================
    s26 = prs.slides.add_slide(blank_layout)
    bg26 = s26.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    bg26.fill.solid()
    bg26.fill.fore_color.rgb = BG_DARK
    bg26.line.fill.background()

    card_end = s26.shapes.add_textbox(Inches(1.0), Inches(1.2), Inches(11.333), Inches(5.0))
    tfe = card_end.text_frame
    tfe.word_wrap = True

    p = tfe.paragraphs[0]
    p.text = "EVENT 1 PROJECT SUMMARY & LIVE DEMO"
    p.font.bold = True
    p.font.size = Pt(14)
    p.font.color.rgb = RGBColor(56, 189, 248)
    p.space_after = Pt(12)

    p1 = tfe.add_paragraph()
    p1.text = "MedMart: Retail Inventory & Sales Analytics System"
    p1.font.bold = True
    p1.font.size = Pt(28)
    p1.font.color.rgb = RGBColor(255, 255, 255)
    p1.space_after = Pt(20)

    summary_items = [
        "✔ Complete Event 1 Syllabus Compliance: 13 normalized tables, 20+ verified queries, 2 views, 2 triggers, 2 procedures.",
        "✔ Real-World Pharmaceutical Domain: Multi-branch stock tracking, Schedule H prescription compliance, FEFO expiry management.",
        "✔ Robust Technical Architecture: PostgreSQL 16 ACID transactions, FastAPI asynchronous backend, and modern React 18 SPA.",
        "✔ Live Demonstration Ready: POS Billing Cart with 1-click test scenarios, Concurrency stress test, and SQL Query Explorer.",
    ]
    for s_item in summary_items:
        p = tfe.add_paragraph()
        p.text = s_item
        p.font.size = Pt(13)
        p.font.color.rgb = RGBColor(226, 232, 240)
        p.space_after = Pt(8)

    p_cred = tfe.add_paragraph()
    p_cred.text = "\nThank You! We invite questions from Dr. Trisiladevi C. Nagavi and the Examination Committee."
    p_cred.font.bold = True
    p_cred.font.size = Pt(14)
    p_cred.font.color.rgb = RGBColor(129, 140, 248)

    prs.save(output_path)
    print(f"Presentation saved successfully to: {os.path.abspath(output_path)}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "MedMart_DBMS_Event1_Presentation.pptx"
    create_presentation(out)
