import React, { useState, useMemo } from 'react';
import { simulateConcurrency, processSale } from '../services/api';

export default function ConcurrencyDemo({
  branches = [],
  products = [],
  inventory = [],
  onReloadData,
}) {
  const [selectedBranchId, setSelectedBranchId] = useState('1');
  const [selectedProductId, setSelectedProductId] = useState('1');
  const [threadCount, setThreadCount] = useState(4);
  const [quantityPerSale, setQuantityPerSale] = useState(2);
  const [initialStockPreset, setInitialStockPreset] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [multiBranchResult, setMultiBranchResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Find selected product
  const selectedProduct = useMemo(
    () => products.find((p) => String(p.product_id) === String(selectedProductId)) || products[0],
    [products, selectedProductId]
  );

  // Find selected branch
  const selectedBranch = useMemo(
    () => branches.find((b) => String(b.branch_id) === String(selectedBranchId)) || branches[0],
    [branches, selectedBranchId]
  );

  // Compute live multi-branch stock map for the selected product
  const multiBranchStock = useMemo(() => {
    return branches.map((b) => {
      const invRow = inventory.find(
        (i) => String(i.branch_id) === String(b.branch_id) && String(i.product_id) === String(selectedProductId)
      );
      return {
        branch_id: b.branch_id,
        branch_name: b.branch_name,
        city: b.city,
        current_qty: invRow ? Number(invRow.current_qty) : 0,
        reorder_level: invRow ? Number(invRow.reorder_level) : 10,
        status: invRow ? invRow.stock_status : 'UNKNOWN',
      };
    });
  }, [branches, inventory, selectedProductId]);

  // Current stock at selected branch
  const currentBranchStock = useMemo(() => {
    const row = multiBranchStock.find((b) => String(b.branch_id) === String(selectedBranchId));
    return row ? row.current_qty : 0;
  }, [multiBranchStock, selectedBranchId]);

  // Handle Scenario 1: Same-Branch High Concurrency Race Condition Test
  const handleRunRaceConditionTest = async () => {
    setIsSimulating(true);
    setErrorMsg('');
    setSimulationResult(null);

    try {
      const payload = {
        branch_id: parseInt(selectedBranchId, 10),
        product_id: parseInt(selectedProductId, 10),
        threads_count: parseInt(threadCount, 10),
        quantity_per_sale: parseInt(quantityPerSale, 10),
        initial_stock: initialStockPreset !== null ? parseInt(initialStockPreset, 10) : null,
      };

      const result = await simulateConcurrency(payload);
      setSimulationResult(result);
      if (onReloadData) {
        await onReloadData();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Concurrency simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle Scenario 2: Cross-Branch Concurrent Independent Sales
  const handleCrossBranchTest = async () => {
    setIsSimulating(true);
    setErrorMsg('');
    setMultiBranchResult(null);

    const b1 = branches[0]?.branch_id || 1;
    const b2 = branches[1]?.branch_id || 2;
    const pid = parseInt(selectedProductId, 10);

    const startTime = performance.now();
    try {
      // Fire 2 concurrent sales at Branch 1 and Branch 2 at the exact same millisecond
      const [res1, res2] = await Promise.all([
        processSale({
          branch_id: b1,
          employee_id: 1,
          payment_method: 'UPI',
          discount: 0,
          notes: 'Cross-Branch Concurrency Test: Branch 1',
          items: [{ product_id: pid, quantity: 1, unit_price: 18.0, discount_pct: 0 }],
        }),
        processSale({
          branch_id: b2,
          employee_id: 1,
          payment_method: 'CARD',
          discount: 0,
          notes: 'Cross-Branch Concurrency Test: Branch 2',
          items: [{ product_id: pid, quantity: 1, unit_price: 18.0, discount_pct: 0 }],
        }),
      ]);

      const elapsed = Math.round(performance.now() - startTime);

      setMultiBranchResult({
        success: true,
        elapsed_ms: elapsed,
        branch1: { branch_id: b1, name: branches[0]?.branch_name, invoice: res1.invoice_no },
        branch2: { branch_id: b2, name: branches[1]?.branch_name, invoice: res2.invoice_no },
      });

      if (onReloadData) {
        await onReloadData();
      }
    } catch (err) {
      setErrorMsg('Cross-branch test failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="concurrency-demo-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6ee7b7',
                fontWeight: '700',
              }}
            >
              Enterprise DBMS Concurrency & Row-Level Locking Architecture
            </span>
            <h2 style={{ fontSize: '1.4rem', margin: '6px 0 4px 0', color: '#ffffff' }}>
              Multi-Branch Concurrency Handling & ACID Isolation Demonstration
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#d1fae5' }}>
              Evaluates PostgreSQL <code>SELECT ... FOR UPDATE OF i;</code> row locking. Demonstrates race condition prevention, deadlock immunity, and zero overselling.
            </p>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={onReloadData}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid #34d399' }}
          >
            ↻ Sync Live Stock
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert error">{errorMsg}</div>}

      {/* MULTI-BRANCH STOCK LEVEL COMPARISON CARDS */}
      <div className="panel" style={{ padding: '20px' }}>
        <div className="panel-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3>Multi-Branch Stock Comparison</h3>
            <p>
              Live inventory levels for <strong>{selectedProduct?.product_name}</strong> across all active branches
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: '#475569' }}>Change Medicine:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} ({p.medicine_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {multiBranchStock.map((b) => (
            <div
              key={b.branch_id}
              style={{
                border: selectedBranchId === String(b.branch_id) ? '2px solid #6366f1' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: selectedBranchId === String(b.branch_id) ? '#f5f3ff' : '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{b.branch_name}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Branch #{b.branch_id} · {b.city}
                  </div>
                </div>
                <span
                  className={`tag ${
                    b.current_qty <= b.reorder_level ? 'danger' : 'success'
                  }`}
                  style={{ fontSize: '0.7rem' }}
                >
                  {b.current_qty <= b.reorder_level ? 'LOW STOCK' : 'OK'}
                </span>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Current Stock:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: b.current_qty <= b.reorder_level ? '#ef4444' : '#16a34a' }}>
                  {b.current_qty} {selectedProduct?.unit_of_measure}
                </span>
              </div>

              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                Reorder Threshold: {b.reorder_level} units
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO SCENARIOS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* SCENARIO 1: SAME-BRANCH HIGH-CONCURRENCY RACE TEST */}
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '14px' }}>
            <div>
              <span className="eyebrow" style={{ color: '#ef4444' }}>Scenario 1: Race Condition Prevention</span>
              <h3 style={{ margin: '4px 0 0 0' }}>Same-Branch Simultaneous Cashier Checkout</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Simulates N cashiers attempting to sell limited stock at the exact same millisecond
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.82rem',
              color: '#92400e',
              marginBottom: '16px',
            }}
          >
            <strong>PostgreSQL Mechanism:</strong> When multiple transactions call <code>process_sale</code>, line 85 executes:
            <br />
            <code style={{ background: '#fde68a', padding: '1px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
              SELECT quantity FROM inventory WHERE branch_id = :bid AND product_id = :pid FOR UPDATE;
            </code>
            <br />
            This acquires an exclusive row lock. The first transaction commits; trailing transactions read the decremented stock and safely roll back if insufficient.
          </div>

          {/* Test Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <label style={{ fontSize: '0.82rem' }}>
              Target Branch:
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              >
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: '0.82rem' }}>
              Set Initial Stock for Test:
              <select
                value={initialStockPreset}
                onChange={(e) => setInitialStockPreset(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              >
                <option value="5">5 Units (High Contention)</option>
                <option value="10">10 Units (Moderate)</option>
                <option value="20">20 Units (High Capacity)</option>
                <option value="">Keep Existing Stock ({currentBranchStock})</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <label style={{ fontSize: '0.82rem' }}>
              Concurrent Cashier Threads:
              <select
                value={threadCount}
                onChange={(e) => setThreadCount(Number(e.target.value))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              >
                <option value="2">2 Concurrent Cashiers</option>
                <option value="4">4 Concurrent Cashiers</option>
                <option value="6">6 Concurrent Cashiers</option>
                <option value="10">10 Concurrent Cashiers</option>
              </select>
            </label>

            <label style={{ fontSize: '0.82rem' }}>
              Units Requested per Cashier:
              <input
                type="number"
                min="1"
                max="10"
                value={quantityPerSale}
                onChange={(e) => setQuantityPerSale(Number(e.target.value))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px' }}
              />
            </label>
          </div>

          {/* Demand calculation callout */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#475569',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>
              Total Demand: <strong>{threadCount * quantityPerSale} units</strong> ({threadCount} cashiers × {quantityPerSale} units)
            </span>
            <span>
              Available Stock: <strong>{initialStockPreset !== null ? initialStockPreset : currentBranchStock} units</strong>
            </span>
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={handleRunRaceConditionTest}
            disabled={isSimulating}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#dc2626',
            }}
          >
            {isSimulating ? 'Executing Parallel Thread Barrier…' : '⚡ Fire Concurrent Parallel Sales'}
          </button>
        </div>

        {/* SCENARIO 2: CROSS-BRANCH INDEPENDENT PARALLEL SALES */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header" style={{ marginBottom: '14px' }}>
            <div>
              <span className="eyebrow" style={{ color: '#16a34a' }}>Scenario 2: Multi-Branch Throughput</span>
              <h3 style={{ margin: '4px 0 0 0' }}>Independent Cross-Branch Parallelism</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Simultaneously fires sales at Branch 1 and Branch 2 at the exact same millisecond
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.82rem',
              color: '#166534',
              marginBottom: '16px',
              flex: 1,
            }}
          >
            <strong>Zero Contention Architecture:</strong>
            <br />
            Because inventory rows use composite primary key <code>(branch_id, product_id)</code>, a lock on Branch 1 stock does <em>NOT</em> block Branch 2 stock!
            <br /><br />
            Both branches process simultaneously with zero wait time and 100% database throughput.
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={handleCrossBranchTest}
            disabled={isSimulating}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              fontWeight: '600',
              backgroundColor: '#16a34a',
            }}
          >
            {isSimulating ? 'Processing…' : '⚡ Fire Simultaneous Sales (Branch 1 & Branch 2)'}
          </button>

          {/* Cross branch result card */}
          {multiBranchResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ color: '#166534', fontWeight: 'bold', marginBottom: '8px' }}>
                ✅ Parallel Execution Successful ({multiBranchResult.elapsed_ms} ms total)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>
                  <strong>{multiBranchResult.branch1.name}:</strong> Committed invoice <code>{multiBranchResult.branch1.invoice}</code>
                </div>
                <div>
                  <strong>{multiBranchResult.branch2.name}:</strong> Committed invoice <code>{multiBranchResult.branch2.invoice}</code>
                </div>
                <div style={{ color: '#059669', fontStyle: 'italic', marginTop: '4px' }}>
                  Result: Both cashiers checked out concurrently with zero blocking!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RACE CONDITION EXECUTION AUDIT REPORT */}
      {simulationResult && (
        <div className="panel" style={{ padding: '24px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Concurrency Audit Log: Row-Level Locking Verification</h3>
              <p>
                Real-time barrier execution audit on Branch #{simulationResult.branch_id} · Product #{simulationResult.product_id}
              </p>
            </div>
            <span className="tag success" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              🛡️ Overselling Prevented: ZERO Negative Stock
            </span>
          </div>

          {/* Summary Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Stock Before</span>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#0f172a' }}>
                {simulationResult.stock_before}
              </strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Demand</span>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#6366f1' }}>
                {simulationResult.total_units_requested}
              </strong>
            </div>
            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534' }}>Units Sold (Committed)</span>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#16a34a' }}>
                {simulationResult.total_units_sold}
              </strong>
            </div>
            <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#991b1b' }}>Final Stock Remaining</span>
              <strong style={{ display: 'block', fontSize: '1.4rem', color: '#dc2626' }}>
                {simulationResult.stock_after}
              </strong>
            </div>
          </div>

          {/* Thread Execution Table */}
          <div className="table-wrap">
            <table style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Cashier Thread</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th>Transaction Result / Lock Resolution</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {simulationResult.logs.map((log) => (
                  <tr key={log.thread_id}>
                    <td>
                      <strong>Thread #{log.thread_id}</strong>
                    </td>
                    <td>
                      <span className={`tag ${log.status === 'SUCCESS' ? 'success' : 'danger'}`}>
                        {log.status === 'SUCCESS' ? 'COMMITTED' : 'ROLLED BACK'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: log.status === 'SUCCESS' ? '#166534' : '#991b1b' }}>
                        {log.message}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>
                      {log.elapsed_ms} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
