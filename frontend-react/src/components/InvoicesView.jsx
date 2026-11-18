import React, { useState, useEffect } from 'react';
import { getSales, getInvoice } from '../services/api';

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function InvoicesView({ branches = [], currentUser, onViewReceipt }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(
    currentUser?.role === 'GENERAL_MANAGER' ? '' : currentUser?.branch_id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSales(0, 50, selectedBranchId ? parseInt(selectedBranchId, 10) : null);
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch sales: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedBranchId]);

  const handleInspectInvoice = async (invoiceNo) => {
    try {
      const inv = await getInvoice(invoiceNo);
      if (onViewReceipt) {
        onViewReceipt(inv);
      }
    } catch (err) {
      alert('Failed to load invoice details: ' + err.message);
    }
  };

  const filteredSales = sales.filter((s) => {
    return (
      (s.invoice_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.branch_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.payment_method || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="panel data-panel" style={{ padding: '20px' }}>
      <div className="panel-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2>Sales Transactions & Invoices</h2>
          <p>Complete audit ledger of customer invoices and stock decrement records</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {currentUser?.role === 'GENERAL_MANAGER' && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            className="search-box"
            placeholder="Search invoice #, branch, payment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '240px' }}
          />

          <button
            type="button"
            className="secondary-btn small"
            onClick={fetchSales}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="loading-card">Loading invoices ledger…</div>
      ) : (
        <div className="table-wrap">
          <table style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Branch</th>
                <th>Date & Time</th>
                <th>Payment</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
                <th style={{ textAlign: 'right' }}>Discount</th>
                <th style={{ textAlign: 'right' }}>Tax</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.sale_id}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', color: '#4f46e5' }}>
                      {sale.invoice_no}
                    </strong>
                    {sale.prescription_no && (
                      <small className="table-subtitle">Rx: {sale.prescription_no}</small>
                    )}
                  </td>
                  <td>{sale.branch_name || `Branch #${sale.branch_id}`}</td>
                  <td>
                    {sale.sale_date
                      ? new Date(sale.sale_date).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </td>
                  <td>
                    <span className="tag">{sale.payment_method || 'CASH'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{currency(sale.subtotal)}</td>
                  <td style={{ textAlign: 'right', color: Number(sale.discount) > 0 ? '#16a34a' : 'inherit' }}>
                    {Number(sale.discount) > 0 ? `- ${currency(sale.discount)}` : '₹0'}
                  </td>
                  <td style={{ textAlign: 'right' }}>{currency(sale.tax_amount)}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>
                    {currency(sale.total_amount)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="secondary-btn small"
                      onClick={() => handleInspectInvoice(sale.invoice_no)}
                      style={{ padding: '4px 10px' }}
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="empty-box">No invoices found matching criteria.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
