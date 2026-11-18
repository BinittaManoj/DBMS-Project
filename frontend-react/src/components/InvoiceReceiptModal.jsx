import React from 'react';

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function InvoiceReceiptModal({ invoiceData, onClose }) {
  if (!invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '540px',
          padding: '28px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Receipt Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏥</span>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>MedMart Pharmacy</h2>
          </div>
          <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#64748b' }}>
            GSTIN: 29ABFFS4049D1Z4 | Lic: KA-MYS-102948
          </p>
          <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#64748b' }}>
            Retail Inventory & Point of Sale System
          </p>
        </div>

        {/* Invoice Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', marginBottom: '16px', color: '#334155' }}>
          <div>
            <strong>Invoice #:</strong>{' '}
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#4f46e5' }}>
              {invoiceData.invoice_no || 'INV-PENDING'}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div>
            <strong>Branch ID:</strong> {invoiceData.branch_id || '1'}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Payment:</strong> {invoiceData.payment_method || 'CASH'}
          </div>
          {invoiceData.prescription_no && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Prescription #:</strong> {invoiceData.prescription_no}
            </div>
          )}
        </div>

        {/* Success Banner */}
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          ✅ Transaction successfully committed to PostgreSQL database.
          <br />
          Stock decremented automatically via <code style={{ background: '#dcfce7', padding: '1px 4px' }}>trg_sale_items_reduce_stock</code>.
        </div>

        {/* Totals Summary */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '20px',
            fontSize: '0.88rem',
          }}
        >
          {invoiceData.subtotal !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748b' }}>
              <span>Gross Subtotal:</span>
              <span>{currency(invoiceData.subtotal)}</span>
            </div>
          )}
          {invoiceData.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#16a34a' }}>
              <span>Discount:</span>
              <span>- {currency(invoiceData.discount)}</span>
            </div>
          )}
          {invoiceData.tax_amount !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#64748b' }}>
              <span>GST:</span>
              <span>{currency(invoiceData.tax_amount)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#0f172a',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '8px',
              marginTop: '6px',
            }}
          >
            <span>Total Paid:</span>
            <span style={{ color: '#4f46e5' }}>{currency(invoiceData.total_amount || 0)}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={handlePrint}
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            🖨️ Print Receipt
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={onClose}
            style={{ padding: '8px 20px' }}
          >
            Done / Next Sale
          </button>
        </div>
      </div>
    </div>
  );
}
