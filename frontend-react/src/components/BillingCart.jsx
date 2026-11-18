import React, { useState, useMemo } from 'react';

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

export default function BillingCart({
  products = [],
  branches = [],
  customers = [],
  currentUser,
  onProcessSale,
  onSuccessInvoice,
}) {
  const [selectedBranchId, setSelectedBranchId] = useState(
    currentUser?.branch_id || branches[0]?.branch_id || '1'
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [employeeId, setEmployeeId] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [billDiscount, setBillDiscount] = useState('0');
  const [prescriptionNo, setPrescriptionNo] = useState('');
  const [notes, setNotes] = useState('');
  
  // Cart state: array of { product, quantity, unit_price, discount_pct }
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract categories for filter
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category_name) cats.add(p.category_name);
    });
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  // Filter products for catalog picker
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        `${p.product_name} ${p.medicine_code || ''} ${p.brand || ''}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === 'ALL' || p.category_name === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Check if any cart item requires prescription
  const prescriptionRequired = useMemo(() => {
    return cart.some((item) => item.product.requires_prescription);
  }, [cart]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const lineGross = Number(item.quantity) * Number(item.unit_price);
      const lineDiscount = lineGross * (Number(item.discount_pct || 0) / 100);
      return sum + (lineGross - lineDiscount);
    }, 0);
  }, [cart]);

  const discountVal = Number(billDiscount) || 0;
  const taxRate = 0.05; // 5% GST
  const taxableAmount = Math.max(0, subtotal - discountVal);
  const taxAmount = taxableAmount * taxRate;
  const totalPayable = taxableAmount + taxAmount;

  // Cart operations
  const addToCart = (product) => {
    setErrorMsg('');
    setCart((prev) => {
      const existing = prev.find((i) => i.product.product_id === product.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product.product_id === product.product_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: Number(product.unit_price) || 0,
          discount_pct: 0,
        },
      ];
    });
  };

  const updateQuantity = (productId, qty) => {
    const newQty = Math.max(1, parseInt(qty, 10) || 1);
    setCart((prev) =>
      prev.map((i) =>
        i.product.product_id === productId ? { ...i, quantity: newQty } : i
      )
    );
  };

  const updateDiscount = (productId, disc) => {
    const newDisc = Math.min(100, Math.max(0, parseFloat(disc) || 0));
    setCart((prev) =>
      prev.map((i) =>
        i.product.product_id === productId ? { ...i, discount_pct: newDisc } : i
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMsg('');
  };

  const applyPreset = (type) => {
    setErrorMsg('');
    if (type === 'otc') {
      const para = products.find((p) => p.product_name?.toLowerCase().includes('paracetamol')) || products[0];
      const cough = products.find((p) => p.product_name?.toLowerCase().includes('cough') || p.product_name?.toLowerCase().includes('syrup')) || products[1];
      const items = [];
      if (para) items.push({ product: para, quantity: 2, unit_price: Number(para.unit_price) || 0, discount_pct: 0 });
      if (cough && cough.product_id !== para?.product_id) items.push({ product: cough, quantity: 1, unit_price: Number(cough.unit_price) || 0, discount_pct: 5 });
      setCart(items);
      setPaymentMethod('CASH');
      setPrescriptionNo('');
      setBillDiscount('0');
      setNotes('Over-the-counter general wellness purchase');
    } else if (type === 'rx') {
      const amox = products.find((p) => p.requires_prescription) || products.find((p) => p.product_name?.toLowerCase().includes('amoxicillin')) || products[0];
      const items = [];
      if (amox) items.push({ product: amox, quantity: 1, unit_price: Number(amox.unit_price) || 0, discount_pct: 0 });
      setCart(items);
      setPaymentMethod('UPI');
      setPrescriptionNo('RX-2026-8910');
      setBillDiscount('0');
      setNotes('Prescribed by Dr. Ramesh Hegde (Reg #KMC-45129)');
    } else if (type === 'chronic') {
      const p1 = products.find((p) => p.product_name?.toLowerCase().includes('omega') || p.product_name?.toLowerCase().includes('vitamin')) || products[0];
      const p2 = products.find((p) => p.product_name?.toLowerCase().includes('digene') || p.product_name?.toLowerCase().includes('antacid')) || products[1];
      const items = [];
      if (p1) items.push({ product: p1, quantity: 1, unit_price: Number(p1.unit_price) || 0, discount_pct: 10 });
      if (p2 && p2.product_id !== p1?.product_id) items.push({ product: p2, quantity: 2, unit_price: Number(p2.unit_price) || 0, discount_pct: 0 });
      setCart(items);
      if (customers.length > 0) setSelectedCustomerId(String(customers[0].customer_id));
      setPaymentMethod('CARD');
      setPrescriptionNo('');
      setBillDiscount('20');
      setNotes('Senior citizen refill with loyalty membership discount');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Please add at least one medicine to the cart.');
      return;
    }

    if (prescriptionRequired && !prescriptionNo.trim()) {
      setErrorMsg(
        'One or more items in the cart require a valid prescription. Please enter the prescription number.'
      );
      return;
    }

    const payload = {
      branch_id: parseInt(selectedBranchId, 10),
      customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : null,
      employee_id: parseInt(employeeId, 10) || 1,
      payment_method: paymentMethod,
      discount: discountVal,
      prescription_no: prescriptionNo.trim() || null,
      notes: notes.trim() || null,
      items: cart.map((item) => ({
        product_id: item.product.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct,
      })),
    };

    setIsSubmitting(true);
    try {
      const result = await onProcessSale(payload);
      if (result && result.success) {
        clearCart();
        setPrescriptionNo('');
        setNotes('');
        setBillDiscount('0');
        if (onSuccessInvoice) {
          onSuccessInvoice(result);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Sale processing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="billing-cart-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
      {/* LEFT COLUMN: Medicine Selector */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2>Select Medicines</h2>
            <p>Search catalog and click to add to customer cart</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="search-box"
              style={{ width: 'auto', padding: '6px 12px' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Demo Bill Presets */}
        <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
              ⚡ 1-Click Demo Billing Presets
            </span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Load sample scenarios instantly</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary-btn small"
              onClick={() => applyPreset('otc')}
              style={{ fontSize: '0.78rem', padding: '5px 9px', background: '#ffffff' }}
            >
              💊 Fever/Cold (OTC)
            </button>
            <button
              type="button"
              className="secondary-btn small"
              onClick={() => applyPreset('rx')}
              style={{ fontSize: '0.78rem', padding: '5px 9px', background: '#ffffff' }}
            >
              🩺 Antibiotic (Rx Required)
            </button>
            <button
              type="button"
              className="secondary-btn small"
              onClick={() => applyPreset('chronic')}
              style={{ fontSize: '0.78rem', padding: '5px 9px', background: '#ffffff' }}
            >
              ❤️ Senior Member (Discount)
            </button>
            {cart.length > 0 && (
              <button
                type="button"
                className="secondary-btn small"
                onClick={clearCart}
                style={{ fontSize: '0.78rem', padding: '5px 9px', color: '#dc2626', borderColor: '#fca5a5' }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        <input
          type="text"
          className="search-box"
          placeholder="Search by medicine name, brand, or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', marginBottom: '16px' }}
        />

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '560px', paddingRight: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {filteredProducts.map((p) => {
              const inCart = cart.find((i) => i.product.product_id === p.product_id);
              return (
                <div
                  key={p.product_id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px',
                    background: inCart ? '#f0fdf4' : '#ffffff',
                    borderColor: inCart ? '#86efac' : '#e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{p.product_name}</strong>
                      {p.requires_prescription && (
                        <span className="tag danger" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          Rx
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      {p.medicine_code} · {p.brand || 'Generic'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                      Unit: {p.unit_of_measure || 'STRIP'} | Schedule: {p.drug_schedule || 'OTC'}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                      {currency(p.unit_price)}
                    </span>
                    <button
                      type="button"
                      className={inCart ? 'secondary-btn small' : 'primary-btn small'}
                      onClick={() => addToCart(p)}
                      style={{ padding: '6px 14px' }}
                    >
                      {inCart ? `+ Add (${inCart.quantity})` : 'Add +'}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="empty-box" style={{ gridColumn: '1 / -1' }}>
                No medicines match your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart & Checkout */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2>Current Invoice Cart</h2>
            <p>{cart.length} item{cart.length === 1 ? '' : 's'} ready for checkout</p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              className="text-btn"
              onClick={clearCart}
              style={{ color: '#ef4444', fontSize: '0.85rem' }}
            >
              Clear Cart
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="alert error" style={{ marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {prescriptionRequired && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              color: '#b45309',
              fontSize: '0.82rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>
              Contains <strong>Schedule / Prescription</strong> medicines. Prescription number is mandatory.
            </span>
          </div>
        )}

        {/* Cart Item Table */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px', marginBottom: '16px' }}>
          {cart.length === 0 ? (
            <div className="empty-box" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🛒</div>
              <strong>Cart is empty</strong>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                Select items from the catalog on the left to start billing.
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px 4px' }}>Medicine</th>
                  <th style={{ padding: '8px 4px', width: '70px' }}>Qty</th>
                  <th style={{ padding: '8px 4px', width: '75px' }}>Price</th>
                  <th style={{ padding: '8px 4px', width: '60px' }}>Disc %</th>
                  <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '8px 4px', width: '32px' }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const gross = item.quantity * item.unit_price;
                  const itemDisc = gross * (item.discount_pct / 100);
                  const net = gross - itemDisc;
                  return (
                    <tr key={item.product.product_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 4px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {item.product.product_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {item.product.requires_prescription ? 'Rx Req' : 'OTC'} ·{' '}
                          {item.product.unit_of_measure}
                        </div>
                      </td>
                      <td style={{ padding: '10px 4px' }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.product_id, e.target.value)}
                          style={{
                            width: '54px',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px 4px' }}>{currency(item.unit_price)}</td>
                      <td style={{ padding: '10px 4px' }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount_pct}
                          onChange={(e) => updateDiscount(item.product.product_id, e.target.value)}
                          style={{
                            width: '48px',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: '600' }}>
                        {currency(net)}
                      </td>
                      <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.product_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Order Details & Checkout Form */}
        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              Branch
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={currentUser?.role !== 'GENERAL_MANAGER'}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              Customer (Optional)
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.first_name} {c.last_name} ({c.phone})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              Payment Method
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="INSURANCE">Insurance Claim</option>
              </select>
            </label>

            <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              Bill Discount (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              Prescription # {prescriptionRequired && <span style={{ color: '#ef4444' }}>*</span>}
              <input
                type="text"
                placeholder={prescriptionRequired ? 'Mandatory for Rx medicines' : 'Optional'}
                value={prescriptionNo}
                onChange={(e) => setPrescriptionNo(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: prescriptionRequired && !prescriptionNo.trim() ? '1px solid #ef4444' : '1px solid #cbd5e1',
                }}
              />
            </label>

            <label style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              Cashier / Emp ID
              <input
                type="number"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </label>
          </div>

          {/* Totals Summary Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
              <span>Items Subtotal:</span>
              <span>{currency(subtotal)}</span>
            </div>
            {discountVal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16a34a', marginBottom: '4px' }}>
                <span>Bill Discount:</span>
                <span>- {currency(discountVal)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '6px' }}>
              <span>GST (5%):</span>
              <span>{currency(taxAmount)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.15rem',
                fontWeight: '700',
                color: '#0f172a',
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '8px',
              }}
            >
              <span>Net Payable:</span>
              <span style={{ color: '#4f46e5' }}>{currency(totalPayable)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="primary-btn"
            disabled={cart.length === 0 || isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              'Processing Transaction…'
            ) : (
              <>
                <span>⚡ Complete Checkout</span>
                <span>({currency(totalPayable)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
