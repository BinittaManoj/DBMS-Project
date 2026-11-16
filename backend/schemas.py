from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BranchBase(BaseModel):
    branch_name: str
    address: str
    city: str
    phone: str
    email: Optional[str] = None
    manager_name: Optional[str] = None
    gstin: Optional[str] = None
    is_active: bool = True


class BranchCreate(BranchBase):
    pass


class BranchUpdate(BranchBase):
    pass


class BranchOut(BranchBase):
    model_config = ConfigDict(from_attributes=True)
    branch_id: int
    created_at: datetime


class CategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    category_id: int
    created_at: datetime


class SupplierBase(BaseModel):
    supplier_name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    gstin: Optional[str] = None
    license_no: Optional[str] = None
    is_active: bool = True


class SupplierCreate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    model_config = ConfigDict(from_attributes=True)
    supplier_id: int
    created_at: datetime


class ProductBase(BaseModel):
    product_name: str
    brand: Optional[str] = None
    category_id: int
    supplier_id: int
    unit_price: float = Field(..., gt=0)
    cost_price: float = Field(..., gt=0)
    unit_of_measure: str = 'STRIP'
    requires_prescription: bool = False
    drug_schedule: str = 'OTC'
    hsn_code: Optional[str] = None
    shelf_life_days: Optional[int] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    created_at: datetime


class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    date_of_birth: Optional[date] = None
    loyalty_points: int = 0


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    customer_id: int
    created_at: datetime


class InventoryBase(BaseModel):
    branch_id: int
    product_id: int
    quantity: int = 0
    reorder_level: int = 10
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    manufacture_date: Optional[date] = None


class InventoryCreate(InventoryBase):
    pass


class InventoryOut(InventoryBase):
    model_config = ConfigDict(from_attributes=True)
    inventory_id: int
    last_restocked_at: Optional[datetime] = None
    updated_at: datetime


class SaleItemPayload(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    discount_pct: float = 0


class ProcessSaleRequest(BaseModel):
    branch_id: int
    customer_id: Optional[int] = None
    employee_id: int
    payment_method: str = 'CASH'
    discount: float = 0
    notes: Optional[str] = None
    prescription_no: Optional[str] = None
    items: list[SaleItemPayload]


class RestockRequest(BaseModel):
    branch_id: int
    product_id: int
    quantity: int = Field(..., gt=0)
    po_id: Optional[int] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    manufacture_date: Optional[date] = None


class DashboardStats(BaseModel):
    total_sales: int
    total_revenue: float
    total_products: int
    total_branches: int
    total_customers: int
    low_stock_count: int
    recent_sales: list[dict]


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    sale_id: int
    invoice_no: str
    branch_id: int
    customer_id: Optional[int]
    employee_id: int
    sale_date: datetime
    subtotal: float
    discount: float
    tax_amount: float
    total_amount: float
    payment_method: str
    notes: Optional[str]
