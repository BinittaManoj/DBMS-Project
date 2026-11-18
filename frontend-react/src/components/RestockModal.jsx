import React, { useState } from 'react';

export default function RestockModal({ targetItem, onClose, onConfirmRestock }) {
  if (!targetItem) return null;

  const [quantity, setQuantity] = useState('25');
  const [batchNumber, setBatchNumber] = useState(targetItem.batch_number || 'BCH-RESTOCK');
  const [expiryDate, setExpiryDate] = useState(
    targetItem.expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [manufactureDate, setManufactureDate] = useState(
    targetItem.manufacture_date || new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentQty = Number(targetItem.current_qty) || 0;
  const addQty = parseInt(quantity, 10) || 0;
  const projectedQty = currentQty + addQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (addQty <= 0) {
      setErrorMsg('Please specify a positive quantity to restock.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onConfirmRestock({
        branch_id: Number(targetItem.branch_id),
        product_id: Number(targetItem.product_id),
        quantity: addQty,
        batch_number: batchNumber.trim() || null,
        expiry_date: expiryDate || null,
        manufacture_date: manufactureDate || null,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Restock failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPreset = (qty) => {
    setQuantity(String(qty));
    setErrorMsg('');
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
          maxWidth: '480px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span className="eyebrow" style={{ color: '#6366f1' }}>Inventory Replenishment</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', color: '#0f172a' }}>
              Restock {targetItem.product_name}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              {targetItem.branch_name || `Branch #${targetItem.branch_id}`} · Reorder Level: {targetItem.reorder_level}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg && <div className="alert error" style={{ marginBottom: '16px' }}>{errorMsg}</div>}

        {/* Current vs Projected Stock Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Current Stock</div>
            <strong style={{ fontSize: '1.2rem', color: currentQty <= targetItem.reorder_level ? '#ef4444' : '#0f172a' }}>
              {currentQty} {targetItem.unit_of_measure}
            </strong>
          </div>
          <div style={{ fontSize: '1.2rem', color: '#94a3b8' }}>➔</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>After Restock</div>
            <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>
              {projectedQty} {targetItem.unit_of_measure}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quick Preset Buttons */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.8rem', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Quick Select Quantity:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={addQty === val ? 'primary-btn small' : 'secondary-btn small'}
                  onClick={() => setPreset(val)}
                  style={{ flex: 1, padding: '6px 0' }}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '12px' }}>
            Units to Add <span style={{ color: '#ef4444' }}>*</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
                fontSize: '0.95rem',
              }}
            />
          </label>

          <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '12px' }}>
            Batch / Lot Number
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                marginTop: '4px',
              }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
            <label style={{ fontSize: '0.82rem' }}>
              Expiry Date
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  marginTop: '4px',
                }}
              />
            </label>

            <label style={{ fontSize: '0.82rem' }}>
              Manufacture Date
              <input
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  marginTop: '4px',
                }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={isSubmitting || addQty <= 0}
              style={{ padding: '8px 20px' }}
            >
              {isSubmitting ? 'Restocking…' : `Confirm Restock (+${addQty})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
