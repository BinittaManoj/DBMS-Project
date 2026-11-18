import React, { useState, useEffect } from 'react';
import {
  getBranchSalesReport,
  getEmployeeSalesReport,
  getInventoryReport,
  getLowStockAlerts,
  resolveLowStockAlert,
} from '../services/api';

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function ReportsView({ branches = [] }) {
  const [activeReport, setActiveReport] = useState('branch-sales'); // 'branch-sales' | 'inventory-status' | 'alerts'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Report Data
  const [branchSalesData, setBranchSalesData] = useState([]);
  const [employeeSalesData, setEmployeeSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [alertsData, setAlertsData] = useState([]);

  // Filters for inventory report
  const [filterBranchId, setFilterBranchId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchBranchSales = async () => {
    try {
      setLoading(true);
      setError('');
      const [branchRes, empRes] = await Promise.all([
        getBranchSalesReport(),
        getEmployeeSalesReport(filterBranchId ? parseInt(filterBranchId, 10) : null),
      ]);
      setBranchSalesData(branchRes?.rows || branchRes || []);
      setEmployeeSalesData(empRes?.rows || empRes || []);
    } catch (err) {
      setError('Failed to fetch branch sales report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeSales = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getEmployeeSalesReport(
        filterBranchId ? parseInt(filterBranchId, 10) : null
      );
      setEmployeeSalesData(data?.rows || data || []);
    } catch (err) {
      setError('Failed to fetch employee sales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getInventoryReport(
        filterBranchId ? parseInt(filterBranchId, 10) : null,
        filterStatus || null
      );
      setInventoryData(data?.rows || data || []);
    } catch (err) {
      setError('Failed to fetch inventory report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getLowStockAlerts(
        filterBranchId ? parseInt(filterBranchId, 10) : null,
        false
      );
      setAlertsData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch alerts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'branch-sales') {
      fetchBranchSales();
    } else if (activeReport === 'employee-sales') {
      fetchEmployeeSales();
    } else if (activeReport === 'inventory-status') {
      fetchInventory();
    } else if (activeReport === 'alerts') {
      fetchAlerts();
    }
  }, [activeReport, filterBranchId, filterStatus]);

  const handleResolveAlert = async (alertId) => {
    try {
      await resolveLowStockAlert(alertId);
      setAlertsData((prev) => prev.filter((a) => a.alert_id !== alertId));
    } catch (err) {
      alert('Failed to resolve alert: ' + err.message);
    }
  };

  return (
    <div className="reports-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Report Switcher Header */}
      <div className="panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="eyebrow">Enterprise DBMS Analytics</span>
            <h2 style={{ margin: '4px 0 0 0' }}>Pharmacy Audit & Operational Reports</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={activeReport === 'branch-sales' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => setActiveReport('branch-sales')}
              style={{ fontSize: '0.85rem' }}
            >
              📊 Branch Sales
            </button>
            <button
              type="button"
              className={activeReport === 'employee-sales' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => setActiveReport('employee-sales')}
              style={{ fontSize: '0.85rem' }}
            >
              🏆 Employee Sales & Performance
            </button>
            <button
              type="button"
              className={activeReport === 'inventory-status' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => setActiveReport('inventory-status')}
              style={{ fontSize: '0.85rem' }}
            >
              📦 Inventory Health (v_inventory_status)
            </button>
            <button
              type="button"
              className={activeReport === 'alerts' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => setActiveReport('alerts')}
              style={{ fontSize: '0.85rem' }}
            >
              ⚠️ Low Stock Trigger Alerts
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {/* REPORT 1: BRANCH SALES SUMMARY */}
      {activeReport === 'branch-sales' && (
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Branch Sales Performance Report</h3>
              <p>Generated directly from database view <code>v_branch_sales_summary</code></p>
            </div>
            <button
              type="button"
              className="secondary-btn small"
              onClick={fetchBranchSales}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-card">Loading sales data…</div>
          ) : (
            <div className="table-wrap">
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th style={{ textAlign: 'center' }}>Total Transactions</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                    <th style={{ textAlign: 'right' }}>Avg Transaction Value</th>
                    <th style={{ textAlign: 'center' }}>Active Employees</th>
                    <th style={{ textAlign: 'right' }}>Highest Single Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {branchSalesData.map((row) => (
                    <tr key={row.branch_id || row.branch_name}>
                      <td>
                        <strong>{row.branch_name}</strong>
                        <small className="table-subtitle">Branch #{row.branch_id}</small>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>
                        {row.total_transactions ?? row.total_sales ?? 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                        {currency(row.total_revenue || 0)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {currency(row.average_sale_value || (row.total_transactions ? row.total_revenue / row.total_transactions : 0))}
                      </td>
                      <td style={{ textAlign: 'center' }}>{row.employee_count ?? '—'}</td>
                      <td style={{ textAlign: 'right' }}>{currency(row.max_sale_amount || 0)}</td>
                    </tr>
                  ))}
                  {branchSalesData.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-box">No branch sales data recorded yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Highest Single Sale Employee Table */}
          {!loading && (
            <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div className="panel-header" style={{ marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#1e293b' }}>
                    🏆 Highest Single Sale & Employee Sales Leaderboard
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Real-time performance tracking: highest single invoice billed by each employee, total volume, and revenue.
                  </p>
                </div>
              </div>
              <div className="table-wrap">
                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Branch</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'center' }}>Total Invoices</th>
                      <th style={{ textAlign: 'right', color: '#2563eb' }}>Highest Single Sale</th>
                      <th style={{ textAlign: 'right' }}>Avg Bill Value</th>
                      <th style={{ textAlign: 'right' }}>Total Revenue Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeSalesData.map((emp) => (
                      <tr key={emp.employee_id}>
                        <td>
                          <strong>{emp.employee_name}</strong>
                          <small className="table-subtitle">Employee #{emp.employee_id}</small>
                        </td>
                        <td>{emp.branch_name}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: '#e0e7ff', color: '#4338ca' }}>
                            {emp.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>
                          {emp.total_transactions}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                          {currency(emp.highest_single_sale)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {currency(emp.avg_sale_value)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                          {currency(emp.total_revenue)}
                        </td>
                      </tr>
                    ))}
                    {employeeSalesData.length === 0 && (
                      <tr>
                        <td colSpan="7">
                          <div className="empty-box">No employee sales records found.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* REPORT 2: EMPLOYEE SALES DEDICATED VIEW */}
      {activeReport === 'employee-sales' && (
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Employee Sales & Highest Single Sale Leaderboard</h3>
              <p>Breakdown of sales, peak billing, and transactions handled per cashier and pharmacist.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="secondary-btn small"
                onClick={fetchEmployeeSales}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-card">Loading employee metrics…</div>
          ) : (
            <div className="table-wrap">
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Branch</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'center' }}>Total Invoices</th>
                    <th style={{ textAlign: 'right', color: '#2563eb' }}>Highest Single Sale</th>
                    <th style={{ textAlign: 'right' }}>Avg Bill Value</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeSalesData.map((emp) => (
                    <tr key={emp.employee_id}>
                      <td>
                        <strong>{emp.employee_name}</strong>
                        <small className="table-subtitle">Employee #{emp.employee_id}</small>
                      </td>
                      <td>{emp.branch_name}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: '#e0e7ff', color: '#4338ca' }}>
                          {emp.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>
                        {emp.total_transactions}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#2563eb' }}>
                        {currency(emp.highest_single_sale)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {currency(emp.avg_sale_value)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#16a34a' }}>
                        {currency(emp.total_revenue)}
                      </td>
                    </tr>
                  ))}
                  {employeeSalesData.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-box">No employee billing records found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REPORT 2: INVENTORY STATUS VIEW */}
      {activeReport === 'inventory-status' && (
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Inventory Health & Expiry Assessment</h3>
              <p>Generated directly from database view <code>v_inventory_status</code></p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
              >
                <option value="">All Statuses</option>
                <option value="OK">OK</option>
                <option value="LOW_STOCK">LOW STOCK</option>
                <option value="OUT_OF_STOCK">OUT OF STOCK</option>
                <option value="NEAR_EXPIRY">NEAR EXPIRY</option>
              </select>

              <button
                type="button"
                className="secondary-btn small"
                onClick={fetchInventory}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-card">Loading inventory status…</div>
          ) : (
            <div className="table-wrap">
              <table style={{ width: '100%', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Medicine</th>
                    <th>Batch</th>
                    <th style={{ textAlign: 'center' }}>Current Qty</th>
                    <th style={{ textAlign: 'center' }}>Reorder Level</th>
                    <th>Status</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={row.stock_status !== 'OK' ? 'alert-row' : ''}
                    >
                      <td>{row.branch_name}</td>
                      <td>
                        <strong>{row.product_name}</strong>
                        <small className="table-subtitle">{row.medicine_code || ''} · {row.brand || 'Generic'}</small>
                      </td>
                      <td>{row.batch_number || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>
                        {row.current_qty} {row.unit_of_measure}
                      </td>
                      <td style={{ textAlign: 'center' }}>{row.reorder_level}</td>
                      <td>
                        <span
                          className={`tag ${
                            row.stock_status === 'OK'
                              ? ''
                              : row.stock_status === 'OUT_OF_STOCK'
                              ? 'danger'
                              : 'warning'
                          }`}
                        >
                          {(row.stock_status || 'OK').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{row.expiry_date || '—'}</td>
                    </tr>
                  ))}
                  {inventoryData.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-box">No matching inventory records found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REPORT 3: LOW STOCK ALERTS */}
      {activeReport === 'alerts' && (
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Low Stock Trigger Alerts Log</h3>
              <p>
                Trigger <code>trg_low_stock_alert</code> automatically writes to <code>low_stock_alerts</code> when stock falls below reorder level.
              </p>
            </div>
            <button
              type="button"
              className="secondary-btn small"
              onClick={fetchAlerts}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-card">Loading trigger alerts…</div>
          ) : (
            <div className="table-wrap">
              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Alert #</th>
                    <th>Branch</th>
                    <th>Medicine</th>
                    <th>Quantity at Alert</th>
                    <th>Reorder Level</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alertsData.map((alertItem) => (
                    <tr key={alertItem.alert_id}>
                      <td>#{alertItem.alert_id}</td>
                      <td>{alertItem.branch_name || `Branch #${alertItem.branch_id}`}</td>
                      <td>
                        <strong>{alertItem.product_name || `Product #${alertItem.product_id}`}</strong>
                      </td>
                      <td style={{ color: '#ef4444', fontWeight: 'bold' }}>
                        {alertItem.current_qty ?? alertItem.quantity ?? '—'}
                      </td>
                      <td>{alertItem.reorder_level ?? '—'}</td>
                      <td>
                        {alertItem.created_at
                          ? new Date(alertItem.created_at).toLocaleString('en-IN')
                          : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn small"
                          onClick={() => handleResolveAlert(alertItem.alert_id)}
                        >
                          Mark Resolved
                        </button>
                      </td>
                    </tr>
                  ))}
                  {alertsData.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-box">
                          ✅ No active low stock alerts! All branch inventories are above reorder thresholds.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
