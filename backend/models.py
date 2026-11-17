from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Identity, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class AppUser(Base):
    __tablename__ = 'app_user'
    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    branch_id = Column(Integer, ForeignKey('branches.branch_id'), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class Branch(Base):
    __tablename__ = 'branches'
    branch_id = Column(Integer, primary_key=True, index=True)
    branch_name = Column(String(100), nullable=False, unique=True)
    address = Column(Text, nullable=False)
    city = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    manager_name = Column(String(100), nullable=True)
    gstin = Column(String(20), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    employees = relationship('Employee', back_populates='branch')
    inventory = relationship('Inventory', back_populates='branch')
    sales = relationship('Sale', back_populates='branch')
    app_users = relationship('AppUser', back_populates='branch')


class Category(Base):
    __tablename__ = 'categories'
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    products = relationship('Product', back_populates='category')


class Supplier(Base):
    __tablename__ = 'suppliers'
    supplier_id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(150), nullable=False, unique=True)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(50), nullable=True)
    gstin = Column(String(20), nullable=True)
    license_no = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    products = relationship('Product', back_populates='supplier')
    purchase_orders = relationship('PurchaseOrder', back_populates='supplier')


class Product(Base):
    __tablename__ = 'products'
    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), nullable=False)
    brand = Column(String(100), nullable=True)
    category_id = Column(Integer, ForeignKey('categories.category_id'), nullable=False)
    supplier_id = Column(Integer, ForeignKey('suppliers.supplier_id'), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    cost_price = Column(Numeric(12, 2), nullable=False)
    unit_of_measure = Column(String(20), nullable=False, default='STRIP')
    requires_prescription = Column(Boolean, nullable=False, default=False)
    drug_schedule = Column(String(5), nullable=True)
    hsn_code = Column(String(10), nullable=True)
    shelf_life_days = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('product_name', 'brand', name='uq_products_name_brand'),)

    category = relationship('Category', back_populates='products')
    supplier = relationship('Supplier', back_populates='products')
    inventory = relationship('Inventory', back_populates='product')
    sale_items = relationship('SaleItem', back_populates='product')
    po_items = relationship('PurchaseOrderItem', back_populates='product')


class Customer(Base):
    __tablename__ = 'customers'
    customer_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(50), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    loyalty_points = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    sales = relationship('Sale', back_populates='customer')


class Employee(Base):
    __tablename__ = 'employees'
    employee_id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey('branches.branch_id'), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    hire_date = Column(Date, nullable=False)
    salary = Column(Numeric(12, 2), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    branch = relationship('Branch', back_populates='employees')
    sales = relationship('Sale', back_populates='employee')
    purchase_orders = relationship('PurchaseOrder', back_populates='employee')


AppUser.branch = relationship('Branch', back_populates='app_users')


class Inventory(Base):
    __tablename__ = 'inventory'
    inventory_id = Column(Integer, Identity(always=True), unique=True, nullable=False)
    branch_id = Column(Integer, ForeignKey('branches.branch_id'), primary_key=True)
    product_id = Column(Integer, ForeignKey('products.product_id'), primary_key=True)
    quantity = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=10)
    batch_number = Column(String(50), nullable=True)
    expiry_date = Column(Date, nullable=True)
    manufacture_date = Column(Date, nullable=True)
    last_restocked_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('branch_id', 'product_id', name='uq_inventory_branch_product'),)

    branch = relationship('Branch', back_populates='inventory')
    product = relationship('Product', back_populates='inventory')


class Sale(Base):
    __tablename__ = 'sales'
    sale_id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(30), nullable=False, unique=True)
    branch_id = Column(Integer, ForeignKey('branches.branch_id'), nullable=False)
    customer_id = Column(Integer, ForeignKey('customers.customer_id'), nullable=True)
    employee_id = Column(Integer, ForeignKey('employees.employee_id'), nullable=False)
    sale_date = Column(DateTime(timezone=True), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    payment_method = Column(String(20), nullable=False, default='CASH')
    prescription_no = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    branch = relationship('Branch', back_populates='sales')
    customer = relationship('Customer', back_populates='sales')
    employee = relationship('Employee', back_populates='sales')
    sale_items = relationship('SaleItem', back_populates='sale')


class SaleItem(Base):
    __tablename__ = 'sale_items'
    sale_item_id = Column(Integer, Identity(always=True), unique=True, nullable=False)
    sale_id = Column(Integer, ForeignKey('sales.sale_id', ondelete='CASCADE'), primary_key=True)
    product_id = Column(Integer, ForeignKey('products.product_id'), primary_key=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount_pct = Column(Numeric(5, 2), nullable=False, default=0)
    subtotal = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    sale = relationship('Sale', back_populates='sale_items')
    product = relationship('Product', back_populates='sale_items')


class PurchaseOrder(Base):
    __tablename__ = 'purchase_orders'
    po_id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(30), nullable=False, unique=True)
    branch_id = Column(Integer, ForeignKey('branches.branch_id'), nullable=False)
    supplier_id = Column(Integer, ForeignKey('suppliers.supplier_id'), nullable=False)
    employee_id = Column(Integer, ForeignKey('employees.employee_id'), nullable=False)
    po_date = Column(DateTime(timezone=True), nullable=False)
    expected_delivery = Column(Date, nullable=True)
    received_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default='PENDING')
    total_amount = Column(Numeric(12, 2), nullable=True, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    supplier = relationship('Supplier', back_populates='purchase_orders')
    employee = relationship('Employee', back_populates='purchase_orders')
    po_items = relationship('PurchaseOrderItem', back_populates='purchase_order')


class PurchaseOrderItem(Base):
    __tablename__ = 'purchase_order_items'
    po_item_id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey('purchase_orders.po_id', ondelete='CASCADE'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    quantity_ordered = Column(Integer, nullable=False)
    quantity_received = Column(Integer, nullable=False, default=0)
    unit_cost = Column(Numeric(12, 2), nullable=False)
    batch_number = Column(String(50), nullable=True)
    expiry_date = Column(Date, nullable=True)
    manufacture_date = Column(Date, nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    product = relationship('Product', back_populates='po_items')
    purchase_order = relationship('PurchaseOrder', back_populates='po_items')


class LowStockAlert(Base):
    __tablename__ = 'low_stock_alerts'
    alert_id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey('branches.branch_id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    current_quantity = Column(Integer, nullable=False)
    reorder_level = Column(Integer, nullable=False)
    alert_type = Column(String(20), nullable=False, default='LOW_STOCK')
    alert_message = Column(Text, nullable=True)
    is_resolved = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
