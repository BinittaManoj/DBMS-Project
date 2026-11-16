import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  createBranch,
  createProduct,
  getBranches,
  getCustomers,
  getInventoryStatus,
  getProducts,
  getSuppliers,
  processSale,
  restockInventory,
} from './services/api';

const STORAGE_KEY = 'medmart_user_session';
const DEMO_USERS = {
  manager: { username: 'manager', password: 'manager123', role: 'manager', name: 'Store Manager' },
  cashier1: { username: 'cashier1', password: 'cashier123', role: 'cashier', name: 'Cashier 1' },
  cashier2: { username: 'cashier2', password: 'cashier123', role: 'cashier', name: 'Cashier 2' },
  cashier3: { username: 'cashier3', password: 'cashier123', role: 'cashier', name: 'Cashier 3' },
};

const defaultProductForm = {
  product_name: '',
  brand: '',
  category_id: '1',
  supplier_id: '1',
  unit_price: '0',
  cost_price: '0',
  drug_schedule: 'OTC',
};

const defaultBranchForm = {
  branch_name: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  manager_name: '',
};

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('manager');
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [branchForm, setBranchForm] = useState(defaultBranchForm);
  const [saleForm, setSaleForm] = useState({
    branch_id: '1',
    customer_id: '',
    employee_id: '1',
    payment_method: 'CASH',
    discount: '0',
    notes: '',
    prescription_no: '',
    items: '[{"product_id":1,"quantity":1,"unit_price":120,"discount_pct":0}]',
  });
  const [managerSearch, setManagerSearch] = useState('');
  const [cashierSearch, setCashierSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const role = user?.role || 'manager';

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      const [inventoryData, productData, branchData, supplierData, customerData] = await Promise.all([
        getInventoryStatus(),
        getProducts(),
        getBranches(),
        getSuppliers(),
        getCustomers(),
      ]);

      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      setProducts(Array.isArray(productData) ? productData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      setCustomers(Array.isArray(customerData) ? customerData : []);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const stats = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + Number(item.current_quantity || 0), 0);
    const lowStock = inventory.filter((item) => Number(item.current_quantity || 0) <= Number(item.reorder_level || 0)).length;
    const healthy = inventory.filter((item) => Number(item.current_quantity || 0) > Number(item.reorder_level || 0)).length;

    return [
      { label: 'Inventory Units', value: totalItems.toLocaleString(), change: '+8.2%', tone: 'positive' },
      { label: 'Low Stock', value: String(lowStock), change: '-2.1%', tone: 'warning' },
      { label: 'Healthy Items', value: String(healthy), change: '+5.6%', tone: 'positive' },
      { label: 'Branches', value: String(branches.length || 3), change: '+1', tone: 'neutral' },
    ];
  }, [inventory, branches]);

  const filteredInventory = useMemo(() => {
    const query = managerSearch.trim().toLowerCase();
    if (!query) return inventory;
    return inventory.filter((row) => {
      const text = `${row.branch_name || ''} ${row.product_name || ''} ${row.recommendation || ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [inventory, managerSearch]);

  const filteredCustomers = useMemo(() => {
    const query = cashierSearch.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => {
      const text = `${customer.first_name || ''} ${customer.last_name || ''} ${customer.phone || ''} ${customer.city || ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [customers, cashierSearch]);

  const handleLogin = (event) => {
    event.preventDefault();
    const userRecord = Object.values(DEMO_USERS).find(
      (entry) => entry.username === loginForm.username && entry.password === loginForm.password,
    );

    if (!userRecord) {
      setError('Invalid username or password');
      return;
    }

    const sessionUser = { ...userRecord };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setActiveTab(sessionUser.role);
    setError('');
    setMessage('Login successful');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setLoginForm({ username: '', password: '' });
    setMessage('Logged out');
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      setMessage('');
      await createProduct({
        ...productForm,
        category_id: Number(productForm.category_id),
        supplier_id: Number(productForm.supplier_id),
        unit_price: Number(productForm.unit_price),
        cost_price: Number(productForm.cost_price),
        is_active: true,
      });
      setProductForm(defaultProductForm);
      setMessage('Product added successfully');
      await loadData();
    } catch (err) {
      setError(err.message || 'Product add failed');
    }
  };

  const handleBranchSubmit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      setMessage('');
      await createBranch({ ...branchForm, is_active: true });
      setBranchForm(defaultBranchForm);
      setMessage('Branch added successfully');
      await loadData();
    } catch (err) {
      setError(err.message || 'Branch add failed');
    }
  };

  const handleRestock = async (row) => {
    const qty = Number(window.prompt(`Enter restock quantity for ${row.product_name || 'this product'}:`, '25'));
    if (!qty || qty <= 0) return;

    try {
      setError('');
      setMessage('');
      await restockInventory({
        branch_id: Number(row.branch_id),
        product_id: Number(row.product_id),
        quantity: qty,
      });
      setMessage(`Restocked ${qty} units successfully`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Restock failed');
    }
  };

  const handleSaleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      setMessage('');

      const payload = {
        branch_id: Number(saleForm.branch_id),
        customer_id: saleForm.customer_id ? Number(saleForm.customer_id) : null,
        employee_id: Number(saleForm.employee_id),
        payment_method: saleForm.payment_method,
        discount: Number(saleForm.discount || 0),
        notes: saleForm.notes || null,
        prescription_no: saleForm.prescription_no || null,
        items: JSON.parse(saleForm.items),
      };

      const result = await processSale(payload);
      setMessage(`${user?.name || 'Cashier'} processed sale successfully${result?.invoice_no ? ` — ${result.invoice_no}` : ''}`);
      setSaleForm({
        branch_id: '1',
        customer_id: '',
        employee_id: '1',
        payment_method: 'CASH',
        discount: '0',
        notes: '',
        prescription_no: '',
        items: '[{"product_id":1,"quantity":1,"unit_price":120,"discount_pct":0}]',
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Sale failed');
    }
  };

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark large">M</div>
            <div>
              <p className="eyebrow">pharmacy suite</p>
              <h1>MedMart</h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <label>
              Username
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="manager or cashier1"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </label>

            {error && <div className="alert-box error-box">{error}</div>}

            <button type="submit" className="primary-button form-wide">Login</button>
          </form>

          <div className="demo-box">
            <p>Demo accounts</p>
            <div className="demo-row"><span>Manager</span><strong>manager / manager123</strong></div>
            <div className="demo-row"><span>Cashier</span><strong>cashier1 / cashier123</strong></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark">M</div>
          <div>
            <p className="eyebrow">Pharmacy Suite</p>
            <h2>MedMart</h2>
          </div>
        </div>

        <nav className="nav-menu">
          <button type="button" className={activeTab === 'manager' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('manager')}>
            Manager
          </button>
          <button type="button" className={activeTab === 'cashier' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('cashier')}>
            Cashier
          </button>
        </nav>

        <div className="sidebar-card">
          <p>Logged in</p>
          <strong>{user.name}</strong>
          <span>{user.role.toUpperCase()}</span>
        </div>

        <button type="button" className="secondary-button" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Business overview</p>
            <h1>{user.role === 'manager' ? 'Manager operations' : 'Cashier terminal'}</h1>
          </div>

          <div className="actions">
            <span className="user-badge">{user.role.toUpperCase()}</span>
            <button type="button" className="secondary-button" onClick={loadData}>Refresh</button>
          </div>
        </header>

        {(message || error) && (
          <div className={error ? 'alert-box error-box' : 'alert-box success-box'}>{error || message}</div>
        )}

        {activeTab === 'manager' && (
          <>
            <section className="stats-grid">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <div className="stat-header">
                    <span>{stat.label}</span>
                    <span className={`trend ${stat.tone}`}>{stat.change}</span>
                  </div>
                  <h3>{stat.value}</h3>
                </div>
              ))}
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Add product</p>
                    <h3>Product manager</h3>
                  </div>
                </div>
                <form className="form-grid" onSubmit={handleProductSubmit}>
                  <input value={productForm.product_name} onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })} placeholder="Product name" required />
                  <input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} placeholder="Brand" />
                  <input type="number" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} placeholder="Category ID" required />
                  <input type="number" value={productForm.supplier_id} onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })} placeholder="Supplier ID" required />
                  <input type="number" step="0.01" value={productForm.unit_price} onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })} placeholder="Unit price" required />
                  <input type="number" step="0.01" value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} placeholder="Cost price" required />
                  <input value={productForm.drug_schedule} onChange={(e) => setProductForm({ ...productForm, drug_schedule: e.target.value })} placeholder="OTC/H/X" />
                  <button type="submit" className="primary-button form-wide">Add Product</button>
                </form>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Add branch</p>
                    <h3>Branch manager</h3>
                  </div>
                </div>

                <form className="form-grid" onSubmit={handleBranchSubmit}>
                  <input value={branchForm.branch_name} onChange={(e) => setBranchForm({ ...branchForm, branch_name: e.target.value })} placeholder="Branch name" required />
                  <input value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} placeholder="Address" required />
                  <input value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} placeholder="City" required />
                  <input value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="Phone" required />
                  <input value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} placeholder="Email" />
                  <input value={branchForm.manager_name} onChange={(e) => setBranchForm({ ...branchForm, manager_name: e.target.value })} placeholder="Manager name" />
                  <button type="submit" className="primary-button form-wide">Add Branch</button>
                </form>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Live overview</p>
                  <h3>Inventory status</h3>
                </div>
                <input
                  className="search-input"
                  value={managerSearch}
                  onChange={(e) => setManagerSearch(e.target.value)}
                  placeholder="Search products..."
                />
              </div>

              {loading ? (
                <div className="status-loading">Loading inventory...</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Reorder</th>
                        <th>Status</th>
                        <th>Qty to add</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length > 0 ? filteredInventory.map((row) => (
                        <tr key={`${row.branch_id}-${row.product_id}`}>
                          <td>{row.branch_name || row.branch_id}</td>
                          <td>{row.product_name}</td>
                          <td>{row.current_quantity}</td>
                          <td>{row.reorder_level}</td>
                          <td>{row.recommendation || 'OK'}</td>
                          <td>
                            <input className="mini-input" type="number" min="1" defaultValue="25" />
                          </td>
                          <td>
                            <button type="button" className="table-button" onClick={() => handleRestock(row)}>Restock</button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="7" className="empty-row">No matching inventory found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'cashier' && (
          <section className="cashier-layout">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Point of sale</p>
                  <h3>Cashier sales</h3>
                </div>
              </div>

              <form className="form-grid sale-form" onSubmit={handleSaleSubmit}>
                <input type="number" value={saleForm.branch_id} onChange={(e) => setSaleForm({ ...saleForm, branch_id: e.target.value })} placeholder="Branch ID" required />
                <input type="number" value={saleForm.customer_id} onChange={(e) => setSaleForm({ ...saleForm, customer_id: e.target.value })} placeholder="Customer ID" />
                <input type="number" value={saleForm.employee_id} onChange={(e) => setSaleForm({ ...saleForm, employee_id: e.target.value })} placeholder="Employee ID" required />
                <select value={saleForm.payment_method} onChange={(e) => setSaleForm({ ...saleForm, payment_method: e.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                </select>
                <input type="number" step="0.01" value={saleForm.discount} onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })} placeholder="Discount" />
                <input value={saleForm.prescription_no} onChange={(e) => setSaleForm({ ...saleForm, prescription_no: e.target.value })} placeholder="Prescription no" />
                <textarea
                  rows="4"
                  value={saleForm.items}
                  onChange={(e) => setSaleForm({ ...saleForm, items: e.target.value })}
                  placeholder='[{"product_id":1,"quantity":2,"unit_price":120,"discount_pct":0}]'
                />
                <textarea
                  rows="2"
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  placeholder="Notes"
                />
                <button type="submit" className="primary-button form-wide">Process Sale</button>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Customer lookup</p>
                  <h3>Customers</h3>
                </div>
                <input
                  className="search-input"
                  value={cashierSearch}
                  onChange={(e) => setCashierSearch(e.target.value)}
                  placeholder="Search customers..."
                />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td>{customer.customer_id}</td>
                        <td>{`${customer.first_name || ''} ${customer.last_name || ''}`.trim()}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.city || ''}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="empty-row">No matching customers found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
