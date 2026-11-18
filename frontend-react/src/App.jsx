import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  addMedicineToInventory,
  createBranch,
  createInventory,
  createProduct,
  deleteBranch,
  deleteInventory,
  deleteProduct,
  getBranches,
  getCategories,
  getCurrentUser,
  getCustomers,
  getDashboardCharts,
  getDashboardStats,
  getEmployees,
  getInventoryStatus,
  getMedicineAnalytics,
  getProducts,
  getSuppliers,
  loginUser,
  logoutUser,
  processSale,
  restockInventory,
  updateBranch,
  updateInventory,
  updateProduct,
} from './services/api';

import BillingCart from './components/BillingCart';
import InvoiceReceiptModal from './components/InvoiceReceiptModal';
import QueryExplorer from './components/QueryExplorer';
import ReportsView from './components/ReportsView';
import InvoicesView from './components/InvoicesView';
import ConcurrencyDemo from './components/ConcurrencyDemo';
import RestockModal from './components/RestockModal';

const defaultProductForm = {
  medicine_code: '',
  product_name: '',
  brand: '',
  image_url: '',
  category_id: '',
  supplier_id: '',
  unit_price: '',
  cost_price: '',
  unit_of_measure: 'STRIP',
  requires_prescription: false,
  drug_schedule: 'OTC',
  hsn_code: '',
  shelf_life_days: '',
};

const defaultBranchForm = {
  branch_name: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  manager_name: '',
  gstin: '',
};

const defaultRestockForm = {
  quantity: '',
  batch_number: '',
  expiry_date: '',
  manufacture_date: '',
};

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

function TrendChart({ data }) {
  const width = 720;
  const height = 280;
  const left = 76;
  const right = 18;
  const top = 18;
  const bottom = 40;
  const values = data.map((item) => Number(item.revenue) || 0);
  const max = Math.max(...values, 1);
  const points = data.map((item, index) => {
    const x =
      data.length < 2
        ? width / 2
        : left + (index * (width - left - right)) / (data.length - 1);
    const y =
      top + ((max - (Number(item.revenue) || 0)) / max) * (height - top - bottom);
    return { x, y, item };
  });
  const line = points.map(({ x, y }, index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${height - bottom} L ${points[0].x} ${height - bottom} Z`
    : '';

  return (
    <div className="chart-frame">
      {data.length ? (
        <svg
          className="trend-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Monthly sales revenue trend"
        >
          {[0, 1, 2, 3].map((step) => {
            const y = top + (step * (height - top - bottom)) / 3;
            const value = max * (1 - step / 3);
            return (
              <g key={step}>
                <line x1={left} x2={width - right} y1={y} y2={y} className="chart-gridline" />
                <text x={left - 10} y={y + 4} textAnchor="end" className="chart-axis-label">
                  {currency(value)}
                </text>
              </g>
            );
          })}
          <path d={area} className="trend-area" />
          <path d={line} className="trend-line" />
          {points.map(({ x, y, item }) => (
            <g key={item.month}>
              <circle cx={x} cy={y} r="5" className="trend-point" />
              <text x={x} y={height - 12} textAnchor="middle" className="chart-axis-label">
                {item.month}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <div className="empty-box">Sales trend will appear when sales are recorded.</div>
      )}
    </div>
  );
}

function BranchRevenueChart({ data }) {
  const width = 520;
  const height = 280;
  const left = 72;
  const right = 12;
  const top = 18;
  const bottom = 50;
  const max = Math.max(...data.map((item) => Number(item.total_revenue) || 0), 1);
  const slot = (width - left - right) / Math.max(data.length, 1);
  const barWidth = Math.min(92, slot * 0.58);

  return (
    <div className="chart-frame">
      {data.length ? (
        <svg
          className="branch-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Revenue by branch"
        >
          {[0, 1, 2, 3].map((step) => {
            const y = top + (step * (height - top - bottom)) / 3;
            return (
              <g key={step}>
                <line x1={left} x2={width - right} y1={y} y2={y} className="chart-gridline" />
                <text x={left - 9} y={y + 4} textAnchor="end" className="chart-axis-label">
                  {currency(max * (1 - step / 3))}
                </text>
              </g>
            );
          })}
          {data.map((item, index) => {
            const revenue = Number(item.total_revenue) || 0;
            const barHeight = (revenue / max) * (height - top - bottom);
            const x = left + slot * index + (slot - barWidth) / 2;
            const y = height - bottom - barHeight;
            return (
              <g key={item.branch_id}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="8"
                  className={`branch-bar color-${index % 3}`}
                />
                <text x={x + barWidth / 2} y={height - 22} textAnchor="middle" className="chart-axis-label">
                  {item.branch_name}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <div className="empty-box">Branch revenue will appear when sales are recorded.</div>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('overview');
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardCharts, setDashboardCharts] = useState({ sales_trend: [], branch_revenue: [] });
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [medicineAnalytics, setMedicineAnalytics] = useState(null);
  const [medicineLoading, setMedicineLoading] = useState(false);
  
  // Inventory Filters
  const [inventoryBranchFilter, setInventoryBranchFilter] = useState('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('');

  // Forms & Modals
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [branchForm, setBranchForm] = useState(defaultBranchForm);
  const [restockForm, setRestockForm] = useState(defaultRestockForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [restockTarget, setRestockTarget] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Inventory CRUD state
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [inventoryFormMode, setInventoryFormMode] = useState('existing'); // 'existing' or 'new'
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [inventoryForm, setInventoryForm] = useState({
    branch_id: '1',
    product_id: '',
    // Brand new medicine fields
    product_name: '',
    brand: '',
    category_id: '1',
    supplier_id: '1',
    unit_price: '120',
    cost_price: '85',
    unit_of_measure: 'STRIP',
    requires_prescription: false,
    drug_schedule: 'OTC',
    // Stock fields
    quantity: '50',
    reorder_level: '15',
    batch_number: 'BATCH-2026',
    expiry_date: '2027-12-31',
  });

  // Auth form
  const [loginForm, setLoginForm] = useState({ email: 'gm@medmart.in', password: 'manager123' });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const [
        inventoryData,
        productData,
        branchData,
        categoryData,
        supplierData,
        customerData,
        employeeData,
        statsData,
        chartsData,
      ] = await Promise.all([
        getInventoryStatus(),
        getProducts(),
        getBranches(),
        getCategories(),
        getSuppliers(),
        getCustomers(),
        getEmployees(),
        getDashboardStats(),
        getDashboardCharts(),
      ]);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      setDashboardStats(statsData);
      setDashboardCharts(chartsData || { sales_trend: [], branch_revenue: [] });
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void Promise.resolve().then(loadData);
  }, [loadData, user]);

  const activeMedicineId = selectedMedicineId || (products[0] ? String(products[0].product_id) : '');
  useEffect(() => {
    if (!user || view !== 'medicine-analytics' || !activeMedicineId) return;
    setMedicineLoading(true);
    getMedicineAnalytics(activeMedicineId)
      .then((data) => {
        setMedicineAnalytics(data);
      })
      .catch((err) => {
        console.error('Failed to load medicine analytics:', err);
      })
      .finally(() => setMedicineLoading(false));
  }, [user, view, activeMedicineId, products.length]);

  const effectiveUser = useMemo(() => {
    if (!user) return null;
    return user.user ? user.user : user;
  }, [user]);

  const userRole = effectiveUser?.role;
  const userBranchId = effectiveUser?.branch_id;

  const visibleBranches = useMemo(() => {
    if (!effectiveUser) return [];
    if (userRole === 'GENERAL_MANAGER') return branches;
    return branches.filter((branch) => branch.branch_id === userBranchId);
  }, [branches, effectiveUser, userRole, userBranchId]);

  const visibleInventory = useMemo(() => {
    if (!effectiveUser) return [];
    if (userRole === 'GENERAL_MANAGER') return inventory;
    if (userBranchId) return inventory.filter((item) => Number(item.branch_id) === Number(userBranchId));
    return inventory;
  }, [inventory, effectiveUser, userRole, userBranchId]);

  const filteredInventory = useMemo(() => {
    const term = search.toLowerCase().trim();
    return visibleInventory.filter((item) => {
      const matchBranch = !inventoryBranchFilter || String(item.branch_id) === String(inventoryBranchFilter);
      const matchStatus = !inventoryStatusFilter || item.stock_status === inventoryStatusFilter;
      const matchSearch =
        !term ||
        (item.product_name || '').toLowerCase().includes(term) ||
        (item.branch_name || '').toLowerCase().includes(term) ||
        (item.brand || '').toLowerCase().includes(term) ||
        (item.batch_number || '').toLowerCase().includes(term);
      return matchBranch && matchStatus && matchSearch;
    });
  }, [search, visibleInventory, inventoryBranchFilter, inventoryStatusFilter]);

  const lowStockItems = useMemo(
    () => visibleInventory.filter((item) => Number(item.current_qty || 0) <= Number(item.reorder_level || 0)),
    [visibleInventory]
  );

  const stats = useMemo(() => {
    const defaultStats = [
      {
        label: 'Total revenue',
        value: currency(dashboardStats?.total_revenue || 0),
        icon: '₹',
        tone: 'accent',
      },
      {
        label: 'Active medicines',
        value: (products.length || 0).toLocaleString(),
        icon: '💊',
        tone: 'neutral',
      },
      {
        label: 'Low stock alerts',
        value: (dashboardStats?.low_stock_count ?? lowStockItems.length).toLocaleString(),
        icon: '⚠️',
        tone: lowStockItems.length > 0 ? 'alert' : 'neutral',
      },
      {
        label: 'Active branches',
        value: visibleBranches.length.toLocaleString(),
        icon: '🏢',
        tone: 'neutral',
      },
    ];
    return defaultStats;
  }, [dashboardStats, lowStockItems.length, products.length, visibleBranches.length]);

  const categoryName = (categoryId) =>
    categories.find((c) => c.category_id === categoryId)?.category_name || 'General';

  const supplierName = (supplierId) =>
    suppliers.find((s) => s.supplier_id === supplierId)?.supplier_name || 'Generic Distributor';

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      setError('');
      setMessage('');
      const loggedIn = await loginUser(loginForm.email, loginForm.password);
      setUser(loggedIn?.user || loggedIn);
      await loadData();
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      setView('overview');
    }
  };

  const handleCreateInventory = async (e) => {
    e.preventDefault();
    try {
      setError('');
      let payload = {
        branch_id: Number(inventoryForm.branch_id),
        quantity: Number(inventoryForm.quantity),
        reorder_level: Number(inventoryForm.reorder_level),
        batch_number: inventoryForm.batch_number || null,
        expiry_date: inventoryForm.expiry_date || null,
      };

      if (inventoryFormMode === 'new') {
        if (!inventoryForm.product_name.trim()) {
          throw new Error('Please enter the medicine name');
        }
        payload = {
          ...payload,
          product_name: inventoryForm.product_name.trim(),
          brand: inventoryForm.brand.trim() || 'Generic',
          category_id: Number(inventoryForm.category_id) || 1,
          supplier_id: Number(inventoryForm.supplier_id) || 1,
          unit_price: Number(inventoryForm.unit_price) || 100,
          cost_price: Number(inventoryForm.cost_price) || 70,
          unit_of_measure: inventoryForm.unit_of_measure || 'STRIP',
          requires_prescription: inventoryForm.requires_prescription,
          drug_schedule: inventoryForm.drug_schedule || 'OTC',
        };
      } else {
        if (!inventoryForm.product_id) {
          throw new Error('Please select a medicine from the catalog');
        }
        payload.product_id = Number(inventoryForm.product_id);
      }

      const res = await addMedicineToInventory(payload);
      setMessage(res.message || '✅ Medicine stocked successfully!');
      setIsAddInventoryOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to add inventory record');
    }
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    if (!editingInventoryItem) return;
    try {
      setError('');
      await updateInventory(editingInventoryItem.branch_id, editingInventoryItem.product_id, {
        quantity: Number(inventoryForm.quantity),
        reorder_level: Number(inventoryForm.reorder_level),
        batch_number: inventoryForm.batch_number || null,
        expiry_date: inventoryForm.expiry_date || null,
      });
      setMessage('✅ Inventory record updated successfully!');
      setEditingInventoryItem(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update inventory record');
    }
  };

  const handleDeleteInventory = async (item) => {
    if (!window.confirm(`Are you sure you want to remove the inventory record for "${item.product_name}" from ${item.branch_name || 'Branch ' + item.branch_id}?`)) {
      return;
    }
    try {
      setError('');
      await deleteInventory(item.branch_id, item.product_id);
      setMessage(`🗑 Inventory record for "${item.product_name}" removed.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete inventory record');
    }
  };

  const startProductEdit = (product) => {
    setEditingProductId(product.product_id);
    setProductForm({
      medicine_code: product.medicine_code || '',
      product_name: product.product_name,
      brand: product.brand || '',
      image_url: product.image_url || '',
      category_id: String(product.category_id || ''),
      supplier_id: String(product.supplier_id || ''),
      unit_price: String(product.unit_price),
      cost_price: String(product.cost_price),
      unit_of_measure: product.unit_of_measure || 'STRIP',
      requires_prescription: Boolean(product.requires_prescription),
      drug_schedule: product.drug_schedule || 'OTC',
      hsn_code: product.hsn_code || '',
      shelf_life_days: product.shelf_life_days ? String(product.shelf_life_days) : '',
    });
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const catId = Number(productForm.category_id) || (categories[0]?.category_id || 1);
      const supId = Number(productForm.supplier_id) || (suppliers[0]?.supplier_id || 1);
      const payload = {
        medicine_code: productForm.medicine_code || null,
        product_name: productForm.product_name,
        brand: productForm.brand || null,
        image_url: productForm.image_url || null,
        category_id: catId,
        supplier_id: supId,
        unit_price: Number(productForm.unit_price),
        cost_price: Number(productForm.cost_price),
        unit_of_measure: productForm.unit_of_measure || 'STRIP',
        requires_prescription: productForm.requires_prescription,
        drug_schedule: productForm.drug_schedule || 'OTC',
        hsn_code: productForm.hsn_code || null,
        shelf_life_days: productForm.shelf_life_days ? Number(productForm.shelf_life_days) : null,
      };
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        setMessage('Product updated successfully');
      } else {
        await createProduct(payload);
        setMessage('Product added to catalog');
      }
      setEditingProductId(null);
      setProductForm(defaultProductForm);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save product');
    }
  };

  const handleProductDelete = async (product) => {
    if (!window.confirm(`Deactivate ${product.product_name}? It will no longer appear in new sales.`)) return;
    try {
      setError('');
      await deleteProduct(product.product_id);
      setMessage(`${product.product_name} deactivated`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to deactivate product');
    }
  };

  const startBranchEdit = (branch) => {
    setEditingBranchId(branch.branch_id);
    setBranchForm({
      branch_name: branch.branch_name,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      email: branch.email || '',
      manager_name: branch.manager_name || '',
      gstin: branch.gstin || '',
    });
  };

  const handleBranchSubmit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      const payload = {
        branch_name: branchForm.branch_name,
        address: branchForm.address,
        city: branchForm.city,
        phone: branchForm.phone,
        email: branchForm.email || null,
        manager_name: branchForm.manager_name || null,
        gstin: branchForm.gstin || null,
      };
      if (editingBranchId) {
        await updateBranch(editingBranchId, payload);
        setMessage('Branch updated successfully');
      } else {
        await createBranch(payload);
        setMessage('New branch added');
      }
      setEditingBranchId(null);
      setBranchForm(defaultBranchForm);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to save branch');
    }
  };

  const handleBranchDelete = async (branch) => {
    if (!window.confirm(`Deactivate ${branch.branch_name}? Past sales will be preserved.`)) return;
    try {
      setError('');
      await deleteBranch(branch.branch_id);
      setMessage(`${branch.branch_name} deactivated; its history is retained`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Unable to deactivate branch');
    }
  };

  const handleConfirmRestock = async (restockPayload) => {
    try {
      setError('');
      const result = await restockInventory(restockPayload);
      if (!result?.success) throw new Error('The server did not confirm the restock');

      // Optimistic instant state update for immediate UI feedback
      setInventory((prev) =>
        prev.map((item) =>
          Number(item.branch_id) === Number(restockPayload.branch_id) &&
          Number(item.product_id) === Number(restockPayload.product_id)
            ? {
                ...item,
                current_qty: Number(item.current_qty) + Number(restockPayload.quantity),
                stock_status:
                  Number(item.current_qty) + Number(restockPayload.quantity) <= Number(item.reorder_level)
                    ? 'LOW_STOCK'
                    : 'OK',
                batch_number: restockPayload.batch_number || item.batch_number,
                expiry_date: restockPayload.expiry_date || item.expiry_date,
              }
            : item
        )
      );

      setMessage(
        `✅ Restocked ${restockPayload.quantity} units for ${restockTarget?.product_name || 'medicine'} successfully!`
      );
      setRestockTarget(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Restock failed');
      throw err;
    }
  };

  const handleProcessSale = async (payload) => {
    const result = await processSale(payload);
    await loadData();
    return result;
  };

  if (authLoading) {
    return (
      <div className="page-shell center">
        <div className="loading-card">Connecting to MedMart Database…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell auth-shell">
        <div className="auth-card">
          <div className="brand-wrap">
            <div className="brand-mark">✚</div>
            <div>
              <span className="eyebrow">Enterprise DBMS Suite</span>
              <h1>MedMart Pharmacy</h1>
            </div>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
            Multi-Branch Inventory & Sales Analytics System
          </p>
          <form onSubmit={handleLogin} className="stack-form">
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                required
              />
            </label>
            <button type="submit" className="primary-btn">
              Sign In to System
            </button>
          </form>
          {error && <div className="alert error">{error}</div>}
          <div className="demo-accounts">
            <p><strong>Demo Roles:</strong></p>
            <p>General Manager: <code>gm@medmart.in</code> / <code>manager123</code></p>
            <p>Branch 1 Manager: <code>branch1@medmart.in</code> / <code>branch123</code></p>
          </div>
        </div>
      </div>
    );
  }

  const navItems =
    userRole === 'GENERAL_MANAGER'
      ? [
          'overview',
          'billing',
          'invoices',
          'inventory',
          'concurrency',
          'reports',
          'queries',
          'medicine-analytics',
          'products',
          'branches',
          'customers',
        ]
      : [
          'overview',
          'billing',
          'invoices',
          'inventory',
          'concurrency',
          'reports',
          'queries',
          'medicine-analytics',
          'customers',
        ];

  const viewTitles = {
    overview: 'Retail Analytics Dashboard',
    billing: 'Point of Sale & Billing Cart',
    invoices: 'Sales & Invoices Ledger',
    inventory: 'Inventory & Stock Management',
    concurrency: 'Multi-Branch Concurrency & Locking',
    reports: 'Reports & Database Views',
    queries: 'SQL Query Explorer & Viva Demo',
    'medicine-analytics': 'Medicine Analytics',
    products: 'Medicine Catalog',
    branches: 'Branch Management',
    customers: 'Customer Directory',
  };

  const navIcons = {
    overview: '▦',
    billing: '🛒',
    invoices: '📄',
    inventory: '⬡',
    concurrency: '⚡',
    reports: '📊',
    queries: '🔍',
    'medicine-analytics': '⌕',
    products: '◇',
    branches: '⌂',
    customers: '👥',
  };

  const productResults = products.filter((product) =>
    `${product.medicine_code || ''} ${product.product_name} ${product.brand || ''} ${categoryName(
      product.category_id
    )}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  const customerResults = customers.filter((customer) =>
    `${customer.first_name} ${customer.last_name} ${customer.phone} ${customer.city || ''}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  return (
    <div className="page-shell app-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark">✚</div>
          <div>
            <strong>MedMart</strong>
            <small>PHARMACY SUITE</small>
          </div>
        </div>

        <span className="nav-heading">MAIN MENU</span>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              className={view === item ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setView(item);
                setMessage('');
                setError('');
              }}
            >
              <span className="nav-icon">{navIcons[item]}</span>
              {viewTitles[item].split('&')[0].trim()}
            </button>
          ))}
        </nav>

        <div className="sidebar-section">AUTHENTICATED</div>
        <div className="user-panel">
          <span className="avatar">{user.full_name?.charAt(0) || 'M'}</span>
          <span>
            <strong>{user.full_name}</strong>
            <small>
              {user.role === 'GENERAL_MANAGER'
                ? 'General Manager (All Branches)'
                : `Branch #${user.branch_id} Manager`}
            </small>
          </span>
        </div>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          ↪ <span>Log out</span>
        </button>
      </aside>

      {/* WORKSPACE CONTENT AREA */}
      <div className="workspace">
        <header className="topbar">
          <div>
            <h1>{viewTitles[view]}</h1>
            <p>Multi-branch PostgreSQL inventory and sales management</p>
          </div>
          <div className="topbar-actions">
            <span className="date-chip">
              ◷ {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setView('billing')}
            >
              ＋ New Sale
            </button>
          </div>
        </header>

        <main className="main-panel">
          {(message || error) && (
            <div className={`alert ${error ? 'error' : 'success'}`} role="status">
              {error || message}
            </div>
          )}

          {/* VIEW: OVERVIEW DASHBOARD */}
          {view === 'overview' && (
            <>
              {lowStockItems.length > 0 && (
                <div className="stock-notice">
                  <span className="notice-icon">⚠️</span>
                  <span>
                    <strong>Inventory Restock Required:</strong> {lowStockItems.length} medicine(s) are
                    below safety reorder levels.
                  </span>
                  <button type="button" onClick={() => setView('inventory')}>
                    View Low Stock →
                  </button>
                </div>
              )}

              <section className="stats-grid">
                {stats.map((stat) => (
                  <article key={stat.label} className={`stat-card ${stat.tone}`}>
                    <div className="stat-copy">
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                    <span className="stat-icon">{stat.icon}</span>
                    <small>
                      {stat.label === 'Total revenue'
                        ? 'Recorded in sales'
                        : stat.label === 'Active medicines'
                        ? `${visibleBranches.length} branch stores`
                        : stat.label === 'Low stock alerts'
                        ? 'Trigger-monitored'
                        : 'Network branches'}
                    </small>
                  </article>
                ))}
              </section>

              <section className="chart-grid">
                <article className="panel chart-card">
                  <div className="panel-header">
                    <div>
                      <h2>Revenue & Sales Trends</h2>
                      <p>Monthly sales revenue across branches</p>
                    </div>
                    <span className="chart-badge">↗ Actual sales</span>
                  </div>
                  <TrendChart data={dashboardCharts.sales_trend || []} />
                </article>
                <article className="panel chart-card">
                  <div className="panel-header">
                    <div>
                      <h2>Branch Revenue Distribution</h2>
                      <p>Revenue contribution by store</p>
                    </div>
                    <span className="chart-badge live">Live SQL</span>
                  </div>
                  <BranchRevenueChart data={dashboardCharts.branch_revenue || []} />
                </article>
              </section>

              <section className="two-column overview-lower">
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Low stock watch</h2>
                      <p>Medicines that need replenishment</p>
                    </div>
                    <button className="text-btn" type="button" onClick={() => setView('inventory')}>
                      All inventory →
                    </button>
                  </div>
                  <div className="stack-list">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div key={`${item.branch_id}-${item.product_id}`} className="mini-card">
                        <div>
                          <strong>{item.product_name}</strong>
                          <small>{item.branch_name}</small>
                        </div>
                        <span className="tag danger">
                          {item.current_qty} / {item.reorder_level}
                        </span>
                      </div>
                    ))}
                    {!lowStockItems.length && <div className="empty-box">No stock alerts right now.</div>}
                  </div>
                </article>
                <article className="panel">
                  <div className="panel-header">
                    <div>
                      <h2>Network snapshot</h2>
                      <p>Active branches and current stock</p>
                    </div>
                  </div>
                  <div className="snapshot-row">
                    <span>Active branches</span>
                    <strong>{visibleBranches.length}</strong>
                  </div>
                  <div className="snapshot-row">
                    <span>Inventory units</span>
                    <strong>
                      {visibleInventory
                        .reduce((sum, item) => sum + Number(item.current_qty || 0), 0)
                        .toLocaleString()}
                    </strong>
                  </div>
                  <div className="snapshot-row">
                    <span>Active medicines</span>
                    <strong>{products.length}</strong>
                  </div>
                </article>
              </section>
            </>
          )}

          {/* VIEW: POINT OF SALE & BILLING CART */}
          {view === 'billing' && (
            <BillingCart
              products={products}
              branches={visibleBranches}
              customers={customers}
              employees={employees}
              currentUser={user}
              onProcessSale={handleProcessSale}
              onSuccessInvoice={(invoiceResult) => {
                setMessage(`Sale processed successfully! Invoice: ${invoiceResult.invoice_no}`);
                setActiveReceipt(invoiceResult);
              }}
            />
          )}

          {/* VIEW: INVOICES LEDGER */}
          {view === 'invoices' && (
            <InvoicesView
              branches={visibleBranches}
              currentUser={user}
              onViewReceipt={(inv) => setActiveReceipt(inv)}
            />
          )}

          {/* VIEW: REPORTS & VIEWS */}
          {view === 'reports' && <ReportsView branches={visibleBranches} />}

          {/* VIEW: SQL QUERY EXPLORER */}
          {view === 'queries' && <QueryExplorer />}

          {/* VIEW: MULTI-BRANCH CONCURRENCY */}
          {view === 'concurrency' && (
            <ConcurrencyDemo
              branches={visibleBranches}
              products={products}
              inventory={inventory}
              onReloadData={loadData}
            />
          )}

          {/* VIEW: INVENTORY & RESTOCK */}
          {view === 'inventory' && (
            <section className="panel data-panel">
              <div className="panel-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2>Inventory & Stock Management</h2>
                  <p>Real-time stock status across branches, safety reorder thresholds, and instant replenishment</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {userRole === 'GENERAL_MANAGER' && (
                    <select
                      value={inventoryBranchFilter}
                      onChange={(e) => setInventoryBranchFilter(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      <option value="">All Branches</option>
                      {visibleBranches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.branch_name}
                        </option>
                      ))}
                    </select>
                  )}

                  <select
                    value={inventoryStatusFilter}
                    onChange={(e) => setInventoryStatusFilter(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="">All Stock Statuses</option>
                    <option value="OK">OK (Stock Healthy)</option>
                    <option value="LOW_STOCK">Low Stock (Needs Reorder)</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="NEAR_EXPIRY">Near Expiry (&lt; 30 Days)</option>
                  </select>

                  <input
                    className="search-box"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search medicine, branch, batch..."
                    style={{ width: '220px' }}
                  />

                  <button
                    type="button"
                    className="primary-btn small"
                    onClick={() => {
                      setInventoryFormMode('existing');
                      setInventoryForm({
                        branch_id: String(visibleBranches[0]?.branch_id || '1'),
                        product_id: String(products[0]?.product_id || ''),
                        product_name: '',
                        brand: '',
                        category_id: String(categories[0]?.category_id || '1'),
                        supplier_id: String(suppliers[0]?.supplier_id || '1'),
                        unit_price: '120',
                        cost_price: '85',
                        unit_of_measure: 'STRIP',
                        requires_prescription: false,
                        drug_schedule: 'OTC',
                        quantity: '50',
                        reorder_level: '15',
                        batch_number: 'BATCH-' + Math.floor(1000 + Math.random() * 9000),
                        expiry_date: '2027-12-31',
                      });
                      setIsAddInventoryOpen(true);
                    }}
                  >
                    ＋ Add Stock / Medicine
                  </button>

                  <button
                    type="button"
                    className="secondary-btn small"
                    onClick={loadData}
                    disabled={loading}
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="loading-card">Refreshing stock…</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Medicine / batch</th>
                        <th>Available</th>
                        <th>Reorder point</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((row) => (
                        <tr
                          key={`${row.branch_id}-${row.product_id}`}
                          className={
                            Number(row.current_qty || 0) <= Number(row.reorder_level || 0)
                              ? 'alert-row'
                              : ''
                          }
                        >
                          <td>{row.branch_name || row.branch_id}</td>
                          <td>
                            <strong>{row.product_name}</strong>
                            <small className="table-subtitle">
                              {row.brand || 'Generic'}
                              {row.batch_number ? ` · ${row.batch_number}` : ''}
                            </small>
                          </td>
                          <td>
                            <strong>{row.current_qty}</strong> {row.unit_of_measure || ''}
                          </td>
                          <td>
                            {row.reorder_level}
                            <small className="table-subtitle">
                              Recommended: {row.recommended_reorder_qty ?? '—'}
                            </small>
                          </td>
                          <td>{row.expiry_date || '—'}</td>
                          <td>
                            <span className={`tag ${row.stock_status === 'OK' ? '' : 'danger'}`}>
                              {(row.stock_status || 'OK').replaceAll('_', ' ')}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className={Number(row.current_qty || 0) <= Number(row.reorder_level || 0) ? "primary-btn small" : "secondary-btn small"}
                                onClick={() => setRestockTarget(row)}
                                title="Restock units via stored procedure"
                              >
                                + Restock
                              </button>
                              <button
                                type="button"
                                className="secondary-btn small"
                                onClick={() => {
                                  setEditingInventoryItem(row);
                                  setInventoryForm({
                                    branch_id: String(row.branch_id),
                                    product_id: String(row.product_id),
                                    quantity: String(row.current_qty ?? row.quantity ?? 0),
                                    reorder_level: String(row.reorder_level ?? 15),
                                    batch_number: row.batch_number || '',
                                    expiry_date: row.expiry_date || '',
                                  });
                                }}
                                title="Edit reorder threshold, batch or expiry"
                              >
                                ✎ Edit
                              </button>
                              <button
                                type="button"
                                className="secondary-btn small"
                                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                                onClick={() => handleDeleteInventory(row)}
                                title="Delete inventory record"
                              >
                                🗑 Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!filteredInventory.length && (
                        <tr>
                          <td colSpan="7">
                            <div className="empty-box">No inventory records found.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* VIEW: MEDICINE CATALOG */}
          {view === 'products' && (
            <section className="panel data-panel">
              <div className="panel-header">
                <div>
                  <h2>Medicine catalog</h2>
                  <p>Manage pricing, supplier, schedule and prescription requirements</p>
                </div>
                <input
                  className="search-box"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search medicines..."
                />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Category / supplier</th>
                      <th>Price</th>
                      <th>Schedule</th>
                      <th>Unit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productResults.map((product) => (
                      <tr key={product.product_id}>
                        <td>
                          {product.image_url && (
                            <img className="medicine-thumb" src={product.image_url} alt="" loading="lazy" />
                          )}
                          <strong>{product.product_name}</strong>
                          <small className="table-subtitle">
                            {product.medicine_code} · {product.brand || 'Generic'}
                            {product.requires_prescription ? ' · Prescription required' : ''}
                          </small>
                        </td>
                        <td>
                          {categoryName(product.category_id)}
                          <small className="table-subtitle">{supplierName(product.supplier_id)}</small>
                        </td>
                        <td>
                          {currency(product.unit_price)}
                          <small className="table-subtitle">Cost {currency(product.cost_price)}</small>
                        </td>
                        <td>
                          <span className="tag">{product.drug_schedule || 'OTC'}</span>
                        </td>
                        <td>{product.unit_of_measure || 'STRIP'}</td>
                        <td className="action-cell">
                          <button
                            type="button"
                            className="secondary-btn small"
                            onClick={() => startProductEdit(product)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger-btn small"
                            onClick={() => handleProductDelete(product)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!productResults.length && (
                      <tr>
                        <td colSpan="6">
                          <div className="empty-box">No medicines found.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="card-form-box">
                <div className="panel-header">
                  <div>
                    <h2>{editingProductId ? 'Update medicine' : 'Add medicine'}</h2>
                    <p>Maintain pharmacy-specific product and compliance details</p>
                  </div>
                  {editingProductId && (
                    <button
                      type="button"
                      className="secondary-btn small"
                      onClick={() => {
                        setEditingProductId(null);
                        setProductForm(defaultProductForm);
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
                <form onSubmit={handleProductSubmit} className="form-grid">
                  <label>
                    Medicine code
                    <input
                      value={productForm.medicine_code}
                      onChange={(event) =>
                        setProductForm({ ...productForm, medicine_code: event.target.value })
                      }
                      placeholder="Auto-generated if blank"
                    />
                  </label>
                  <label>
                    Medicine name
                    <input
                      value={productForm.product_name}
                      onChange={(event) =>
                        setProductForm({ ...productForm, product_name: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Brand
                    <input
                      value={productForm.brand}
                      onChange={(event) =>
                        setProductForm({ ...productForm, brand: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Image URL
                    <input
                      type="url"
                      value={productForm.image_url}
                      onChange={(event) =>
                        setProductForm({ ...productForm, image_url: event.target.value })
                      }
                      placeholder="https://..."
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={productForm.category_id}
                      onChange={(event) =>
                        setProductForm({ ...productForm, category_id: event.target.value })
                      }
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Supplier
                    <select
                      value={productForm.supplier_id}
                      onChange={(event) =>
                        setProductForm({ ...productForm, supplier_id: event.target.value })
                      }
                      required
                    >
                      <option value="">Select supplier</option>
                      {suppliers
                        .filter((supplier) => supplier.is_active)
                        .map((supplier) => (
                          <option key={supplier.supplier_id} value={supplier.supplier_id}>
                            {supplier.supplier_name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Sale price
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={productForm.unit_price}
                      onChange={(event) =>
                        setProductForm({ ...productForm, unit_price: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Purchase cost
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={productForm.cost_price}
                      onChange={(event) =>
                        setProductForm({ ...productForm, cost_price: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Dispensing unit
                    <select
                      value={productForm.unit_of_measure}
                      onChange={(event) =>
                        setProductForm({ ...productForm, unit_of_measure: event.target.value })
                      }
                    >
                      <option>STRIP</option>
                      <option>BOTTLE</option>
                      <option>TUBE</option>
                      <option>VIAL</option>
                      <option>SACHET</option>
                      <option>PACK</option>
                      <option>PAIR</option>
                    </select>
                  </label>
                  <label>
                    Drug schedule
                    <select
                      value={productForm.drug_schedule}
                      onChange={(event) =>
                        setProductForm({ ...productForm, drug_schedule: event.target.value })
                      }
                    >
                      <option>OTC</option>
                      <option>H</option>
                      <option>H1</option>
                      <option>X</option>
                      <option>G</option>
                    </select>
                  </label>
                  <label>
                    Prescription required
                    <select
                      value={String(productForm.requires_prescription)}
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          requires_prescription: event.target.value === 'true',
                        })
                      }
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </label>
                  <label>
                    HSN code
                    <input
                      value={productForm.hsn_code}
                      onChange={(event) =>
                        setProductForm({ ...productForm, hsn_code: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Shelf life (days)
                    <input
                      type="number"
                      min="1"
                      value={productForm.shelf_life_days}
                      onChange={(event) =>
                        setProductForm({ ...productForm, shelf_life_days: event.target.value })
                      }
                    />
                  </label>
                  <div className="form-actions">
                    <button type="submit" className="primary-btn">
                      {editingProductId ? 'Save medicine' : 'Add medicine'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* VIEW: MEDICINE ANALYTICS */}
          {view === 'medicine-analytics' && (
            <section className="medicine-analytics">
              <article className="panel data-panel">
                <div className="panel-header">
                  <div>
                    <h2>Medicine-by-medicine performance</h2>
                    <p>Review sales, revenue and stock distribution for one medicine</p>
                  </div>
                  <label className="medicine-select">
                    Select medicine
                    <select
                      value={activeMedicineId}
                      onChange={(event) => setSelectedMedicineId(event.target.value)}
                    >
                      {products.map((product) => (
                        <option key={product.product_id} value={product.product_id}>
                          {product.product_name}
                          {product.brand ? ` · ${product.brand}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {medicineLoading || !medicineAnalytics ? (
                  <div className="loading-card" style={{ padding: '36px', textAlign: 'center' }}>
                    {medicineLoading ? 'Loading medicine analytics…' : 'Select a medicine from the dropdown above to view performance analytics.'}
                  </div>
                ) : (
                  <>
                      <div className="medicine-summary">
                        <article>
                          <span>Units sold</span>
                          <strong>{medicineAnalytics.medicine.units_sold.toLocaleString()}</strong>
                        </article>
                        <article>
                          <span>Sales revenue</span>
                          <strong>{currency(medicineAnalytics.medicine.revenue)}</strong>
                        </article>
                        <article>
                          <span>Transactions</span>
                          <strong>
                            {medicineAnalytics.medicine.transactions.toLocaleString()}
                          </strong>
                        </article>
                        <article>
                          <span>Current stock</span>
                          <strong>
                            {medicineAnalytics.branches
                              .reduce((sum, branch) => sum + Number(branch.current_stock || 0), 0)
                              .toLocaleString()}
                          </strong>
                        </article>
                      </div>
                      <div className="medicine-detail">
                        <div>
                          <span>Medicine code</span>
                          <strong>{medicineAnalytics.medicine.medicine_code}</strong>
                        </div>
                        <div>
                          <span>Category</span>
                          <strong>{medicineAnalytics.medicine.category_name}</strong>
                        </div>
                        <div>
                          <span>Supplier</span>
                          <strong>{medicineAnalytics.medicine.supplier_name}</strong>
                        </div>
                        <div>
                          <span>Schedule</span>
                          <strong>{medicineAnalytics.medicine.drug_schedule || 'OTC'}</strong>
                        </div>
                        <div>
                          <span>Dispensing unit</span>
                          <strong>{medicineAnalytics.medicine.unit_of_measure}</strong>
                        </div>
                      </div>
                      <section className="chart-grid medicine-charts">
                        <article className="panel chart-card">
                          <div className="panel-header">
                            <div>
                              <h2>Medicine sales trend</h2>
                              <p>Item revenue by month</p>
                            </div>
                          </div>
                          <TrendChart data={medicineAnalytics.trend} />
                        </article>
                        <article className="panel chart-card">
                          <div className="panel-header">
                            <div>
                              <h2>Medicine by branch</h2>
                              <p>Sales revenue contribution</p>
                            </div>
                          </div>
                          <BranchRevenueChart
                            data={medicineAnalytics.branches.map((branch) => ({
                              ...branch,
                              total_revenue: branch.revenue,
                            }))}
                          />
                        </article>
                      </section>
                      <article className="panel branch-stock-panel">
                        <div className="panel-header">
                          <div>
                            <h2>Branch-level medicine detail</h2>
                            <p>Units sold and stock currently available</p>
                          </div>
                        </div>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Branch</th>
                                <th>Units sold</th>
                                <th>Sales revenue</th>
                                <th>Current stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medicineAnalytics.branches.map((branch) => (
                                <tr key={branch.branch_id}>
                                  <td>{branch.branch_name}</td>
                                  <td>{branch.units_sold.toLocaleString()}</td>
                                  <td>{currency(branch.revenue)}</td>
                                  <td>{branch.current_stock.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </article>
                    </>
                )}
              </article>
            </section>
          )}

          {/* VIEW: BRANCHES MANAGEMENT (GM ONLY) */}
          {view === 'branches' && (
            <section className="panel data-panel">
              <div className="panel-header">
                <div>
                  <h2>Branch network</h2>
                  <p>Update branch contact details or deactivate locations while preserving transaction history</p>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Location</th>
                      <th>Contact</th>
                      <th>Manager</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleBranches.map((branch) => (
                      <tr key={branch.branch_id}>
                        <td>
                          <strong>{branch.branch_name}</strong>
                          <small className="table-subtitle">ID {branch.branch_id}</small>
                        </td>
                        <td>
                          {branch.city}
                          <small className="table-subtitle">{branch.address}</small>
                        </td>
                        <td>
                          {branch.phone}
                          <small className="table-subtitle">{branch.email || '—'}</small>
                        </td>
                        <td>{branch.manager_name || '—'}</td>
                        <td className="action-cell">
                          <button
                            type="button"
                            className="secondary-btn small"
                            onClick={() => startBranchEdit(branch)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="danger-btn small"
                            onClick={() => handleBranchDelete(branch)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!visibleBranches.length && (
                      <tr>
                        <td colSpan="5">
                          <div className="empty-box">No active branches.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="card-form-box">
                <div className="panel-header">
                  <div>
                    <h2>{editingBranchId ? 'Update branch' : 'Add branch'}</h2>
                    <p>Branch contact and manager information</p>
                  </div>
                  {editingBranchId && (
                    <button
                      type="button"
                      className="secondary-btn small"
                      onClick={() => {
                        setEditingBranchId(null);
                        setBranchForm(defaultBranchForm);
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
                <form onSubmit={handleBranchSubmit} className="form-grid">
                  <label>
                    Branch name
                    <input
                      value={branchForm.branch_name}
                      onChange={(event) =>
                        setBranchForm({ ...branchForm, branch_name: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Address
                    <input
                      value={branchForm.address}
                      onChange={(event) =>
                        setBranchForm({ ...branchForm, address: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    City
                    <input
                      value={branchForm.city}
                      onChange={(event) =>
                        setBranchForm({ ...branchForm, city: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={branchForm.phone}
                      onChange={(event) =>
                        setBranchForm({ ...branchForm, phone: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={branchForm.email}
                      onChange={(event) =>
                        setBranchForm({ ...branchForm, email: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Branch manager
                    <input
                      value={branchForm.manager_name}
                      onChange={(event) =>
                        setBranchForm({ ...branchForm, manager_name: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    GSTIN
                    <input
                      value={branchForm.gstin}
                      onChange={(event) =>
                        setBranchForm({ ...branchForm, gstin: event.target.value })
                      }
                    />
                  </label>
                  <div className="form-actions">
                    <button type="submit" className="primary-btn">
                      {editingBranchId ? 'Save branch' : 'Add branch'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* VIEW: CUSTOMER DIRECTORY */}
          {view === 'customers' && (
            <section className="panel data-panel">
              <div className="panel-header">
                <div>
                  <h2>Customer directory</h2>
                  <p>Customer contact and loyalty information</p>
                </div>
                <input
                  className="search-box"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customers..."
                />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Loyalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerResults.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td>
                          {customer.first_name} {customer.last_name}
                        </td>
                        <td>{customer.email || '—'}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.city || '—'}</td>
                        <td>{customer.loyalty_points} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* INVOICE RECEIPT MODAL */}
      {activeReceipt && (
        <InvoiceReceiptModal
          invoiceData={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* RESTOCK POPUP MODAL */}
      {restockTarget && (
        <RestockModal
          targetItem={restockTarget}
          onClose={() => setRestockTarget(null)}
          onConfirmRestock={handleConfirmRestock}
        />
      )}

      {/* ADD INVENTORY MODAL */}
      {isAddInventoryOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>＋ Add Medicine & Stock Record</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsAddInventoryOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '8px', padding: '6px', background: '#f1f5f9', borderRadius: '8px', margin: '0 20px 16px 20px' }}>
              <button
                type="button"
                className={inventoryFormMode === 'existing' ? 'primary-btn small' : 'secondary-btn small'}
                onClick={() => setInventoryFormMode('existing')}
                style={{ flex: 1, padding: '7px 12px', fontSize: '0.84rem' }}
              >
                📋 Existing Catalog Medicine
              </button>
              <button
                type="button"
                className={inventoryFormMode === 'new' ? 'primary-btn small' : 'secondary-btn small'}
                onClick={() => setInventoryFormMode('new')}
                style={{ flex: 1, padding: '7px 12px', fontSize: '0.84rem' }}
              >
                ✨ New Medicine (Add to Catalog & Stock)
              </button>
            </div>

            <form onSubmit={handleCreateInventory} className="modal-body stack-form" style={{ paddingTop: 0 }}>
              <label>
                Target Branch
                <select
                  value={inventoryForm.branch_id}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, branch_id: e.target.value })}
                  required
                >
                  {visibleBranches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.branch_name} ({b.city})
                    </option>
                  ))}
                </select>
              </label>

              {inventoryFormMode === 'existing' ? (
                <label>
                  Select Medicine from Catalog
                  <select
                    value={inventoryForm.product_id}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, product_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Medicine --</option>
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_name} ({p.brand || 'Generic'}) - ₹{p.unit_price}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                /* NEW MEDICINE DETAILS (SAVES TO CATALOG) */
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#4338ca', letterSpacing: '0.05em' }}>
                    📦 New Catalog Medicine Information
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <label style={{ margin: 0 }}>
                      Medicine Name *
                      <input
                        type="text"
                        value={inventoryForm.product_name}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, product_name: e.target.value })}
                        placeholder="e.g. Azithromycin 500mg"
                        required={inventoryFormMode === 'new'}
                      />
                    </label>
                    <label style={{ margin: 0 }}>
                      Brand / Manufacturer
                      <input
                        type="text"
                        value={inventoryForm.brand}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, brand: e.target.value })}
                        placeholder="e.g. Cipla Ltd"
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ margin: 0 }}>
                      Drug Category
                      <select
                        value={inventoryForm.category_id}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, category_id: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ margin: 0 }}>
                      Supplier / Distributor
                      <select
                        value={inventoryForm.supplier_id}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, supplier_id: e.target.value })}
                      >
                        {suppliers.map((s) => (
                          <option key={s.supplier_id} value={s.supplier_id}>
                            {s.supplier_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ margin: 0 }}>
                      Selling Price (₹) *
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={inventoryForm.unit_price}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, unit_price: e.target.value })}
                        required={inventoryFormMode === 'new'}
                      />
                    </label>
                    <label style={{ margin: 0 }}>
                      Cost Price (₹) *
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={inventoryForm.cost_price}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, cost_price: e.target.value })}
                        required={inventoryFormMode === 'new'}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px' }}>
                    <label style={{ margin: 0 }}>
                      Unit
                      <select
                        value={inventoryForm.unit_of_measure}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, unit_of_measure: e.target.value })}
                      >
                        <option>STRIP</option>
                        <option>BOTTLE</option>
                        <option>TUBE</option>
                        <option>VIAL</option>
                        <option>SACHET</option>
                        <option>PACK</option>
                      </select>
                    </label>
                    <label style={{ margin: 0 }}>
                      Schedule
                      <select
                        value={inventoryForm.drug_schedule}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, drug_schedule: e.target.value })}
                      >
                        <option>OTC</option>
                        <option>H</option>
                        <option>H1</option>
                        <option>X</option>
                        <option>G</option>
                      </select>
                    </label>
                    <label style={{ margin: 0 }}>
                      Prescription Required?
                      <select
                        value={String(inventoryForm.requires_prescription)}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, requires_prescription: e.target.value === 'true' })}
                      >
                        <option value="false">No (Over-the-Counter)</option>
                        <option value="true">Yes (Rx Required)</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {/* COMMON STOCK DETAILS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Initial Stock Quantity
                  <input
                    type="number"
                    min="1"
                    value={inventoryForm.quantity}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Reorder Alert Threshold
                  <input
                    type="number"
                    min="1"
                    value={inventoryForm.reorder_level}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, reorder_level: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Batch Number
                  <input
                    type="text"
                    value={inventoryForm.batch_number}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, batch_number: e.target.value })}
                    placeholder="BATCH-2026"
                  />
                </label>
                <label>
                  Expiry Date
                  <input
                    type="date"
                    value={inventoryForm.expiry_date}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, expiry_date: e.target.value })}
                  />
                </label>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsAddInventoryOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {inventoryFormMode === 'new' ? '✨ Save to Catalog & Stock at Branch' : '＋ Add Stock Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INVENTORY MODAL */}
      {editingInventoryItem && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>✎ Edit Stock Record</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setEditingInventoryItem(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateInventory} className="modal-body stack-form">
              <p style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: '#64748b' }}>
                Editing stock for <strong>{editingInventoryItem.product_name}</strong> at{' '}
                <strong>{editingInventoryItem.branch_name || 'Branch ' + editingInventoryItem.branch_id}</strong>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Current Quantity ({editingInventoryItem.unit_of_measure || 'units'})
                  <input
                    type="number"
                    min="0"
                    value={inventoryForm.quantity}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Reorder Alert Threshold
                  <input
                    type="number"
                    min="1"
                    value={inventoryForm.reorder_level}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, reorder_level: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label>
                  Batch Number
                  <input
                    type="text"
                    value={inventoryForm.batch_number}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, batch_number: e.target.value })}
                  />
                </label>
                <label>
                  Expiry Date
                  <input
                    type="date"
                    value={inventoryForm.expiry_date}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, expiry_date: e.target.value })}
                  />
                </label>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setEditingInventoryItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
