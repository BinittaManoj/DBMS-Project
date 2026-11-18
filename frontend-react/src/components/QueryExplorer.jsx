import React, { useState, useEffect, useMemo } from 'react';
import { getQueriesCatalog, runQuery, runCustomQuery } from '../services/api';

export default function QueryExplorer() {
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState('union_query');
  const [activeTab, setActiveTab] = useState('preset'); // 'preset' or 'custom'
  const [customSql, setCustomSql] = useState('SELECT * FROM v_branch_sales_summary;');
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await getQueriesCatalog();
        if (data && data.queries) {
          setCatalog(data.queries);
          const firstKey = Object.keys(data.queries)[0];
          if (firstKey) setSelectedKey(firstKey);
        }
      } catch (err) {
        setErrorMsg('Failed to load SQL queries catalog: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const selectedQuery = catalog[selectedKey];

  // Group catalog queries dynamically with preferred syllabus order
  const categories = useMemo(() => {
    const grouped = {
      'Set Operations': [],
      'Aggregation & Grouping': [],
      'Search & Filtering': [],
      'Advanced Subqueries': [],
      'Database Views': [],
      'DML (Update & Delete)': [],
    };

    Object.entries(catalog).forEach(([key, q]) => {
      // Avoid duplicate aliases in the preset list
      if (['dml-update-prices', 'dml-update-reorder', 'dml-delete-alerts'].includes(key)) return;
      
      let cat = q.category;
      if (cat === 'Aggregates' || cat === 'Group By & Having') {
        cat = 'Aggregation & Grouping';
      } else if (cat === 'LIKE & BETWEEN') {
        cat = 'Search & Filtering';
      } else if (cat === 'Correlated & EXISTS') {
        cat = 'Advanced Subqueries';
      } else if (!cat) {
        cat = 'General';
      }

      if (!grouped[cat]) grouped[cat] = [];
      if (!grouped[cat].includes(key)) {
        grouped[cat].push(key);
      }
    });

    // Remove empty categories
    Object.keys(grouped).forEach((cat) => {
      if (grouped[cat].length === 0) delete grouped[cat];
    });

    return grouped;
  }, [catalog]);

  const handleExecutePreset = async () => {
    if (!selectedKey) return;
    setIsExecuting(true);
    setErrorMsg('');
    setQueryResult(null);
    try {
      const res = await runQuery(selectedKey);
      const rows = res.data || res.rows || [];
      const columns = res.columns && res.columns.length > 0 
        ? res.columns 
        : (rows.length > 0 ? Object.keys(rows[0]) : []);
      setQueryResult({
        ...res,
        data: rows,
        rows: rows,
        columns: columns,
        row_count: res.row_count !== undefined ? res.row_count : rows.length,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExecuteCustom = async (e) => {
    e.preventDefault();
    if (!customSql.trim()) return;
    setIsExecuting(true);
    setErrorMsg('');
    setQueryResult(null);
    try {
      const res = await runCustomQuery(customSql.trim());
      const rows = res.data || res.rows || [];
      const columns = res.columns && res.columns.length > 0 
        ? res.columns 
        : (rows.length > 0 ? Object.keys(rows[0]) : []);
      setQueryResult({
        ...res,
        data: rows,
        rows: rows,
        columns: columns,
        row_count: res.row_count !== undefined ? res.row_count : rows.length,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="query-explorer-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner explaining DBMS Course Requirement */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
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
                color: '#a5b4fc',
                fontWeight: '700',
              }}
            >
              Academic DBMS Laboratory Deliverable (20CS41L / CS430)
            </span>
            <h2 style={{ fontSize: '1.4rem', margin: '6px 0 4px 0', color: '#ffffff' }}>
              Live SQL Query Explorer & Viva Demonstration
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#c7d2fe' }}>
              Directly executes relational algebra operations (UNION, INTERSECT, EXCEPT, GROUP BY/HAVING, Correlated Subqueries, Views) against PostgreSQL.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={activeTab === 'preset' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => { setActiveTab('preset'); setQueryResult(null); setErrorMsg(''); }}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Course Presets (10)
            </button>
            <button
              type="button"
              className={activeTab === 'custom' ? 'primary-btn' : 'secondary-btn'}
              onClick={() => { setActiveTab('custom'); setQueryResult(null); setErrorMsg(''); }}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              SQL Console
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'preset' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Query Categories Sidebar */}
          <div className="panel" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
              Query Categories
            </h3>
            {loading ? (
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading queries…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {Object.entries(categories).map(([catName, keys]) => (
                  <div key={catName}>
                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {catName}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {keys.map((k) => {
                        const q = catalog[k];
                        if (!q) return null;
                        const isSelected = selectedKey === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              setSelectedKey(k);
                              setQueryResult(null);
                              setErrorMsg('');
                            }}
                            style={{
                              textAlign: 'left',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid #6366f1' : '1px solid transparent',
                              background: isSelected ? '#eef2ff' : 'transparent',
                              color: isSelected ? '#4338ca' : '#475569',
                              fontWeight: isSelected ? '600' : '400',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>{q.title}</span>
                            <span style={{ fontSize: '0.7rem', color: isSelected ? '#6366f1' : '#94a3b8' }}>
                              {q.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Query Details & Execution Window */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedQuery && (
              <div className="panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span className="tag" style={{ background: '#e0e7ff', color: '#3730a3', marginRight: '8px' }}>
                      {selectedQuery.category}
                    </span>
                    <h2 style={{ display: 'inline', fontSize: '1.2rem', color: '#1e293b' }}>
                      {selectedQuery.title}
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      {selectedQuery.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleExecutePreset}
                    disabled={isExecuting}
                    style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isExecuting ? 'Running…' : '▶ Run Query'}
                  </button>
                </div>

                {/* SQL Code Block */}
                <div
                  style={{
                    background: '#0f172a',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    fontSize: '0.85rem',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    border: '1px solid #1e293b',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {selectedQuery.sql}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="alert error">
                <strong>Execution Error:</strong> {errorMsg}
              </div>
            )}

            {/* Execution Result Table */}
            {queryResult && (
              <div className="panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Query Result</h3>
                    <span className="tag" style={{ background: '#dcfce7', color: '#166534' }}>
                      {queryResult.row_count} row{queryResult.row_count === 1 ? '' : 's'} returned
                    </span>
                  </div>
                  {queryResult.execution_time_ms !== undefined && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      ⚡ Execution: {queryResult.execution_time_ms} ms
                    </span>
                  )}
                </div>

                {queryResult.data && queryResult.data.length > 0 ? (
                  <div className="table-wrap" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          {queryResult.columns.map((col) => (
                            <th key={col} style={{ textTransform: 'capitalize' }}>
                              {col.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryResult.data.map((row, idx) => (
                          <tr key={idx}>
                            {queryResult.columns.map((col) => (
                              <td key={col}>
                                {row[col] !== null && row[col] !== undefined
                                  ? String(row[col])
                                  : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>NULL</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-box">Query executed successfully, but returned 0 rows.</div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Custom SQL Console Tab */
        <div className="panel" style={{ padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '16px' }}>
            <div>
              <h2>Interactive SQL Terminal</h2>
              <p>Type any SELECT query to inspect database tables, views, or test SQL syntax live</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => setCustomSql('SELECT * FROM v_branch_sales_summary;')}
              >
                Sample 1: Sales View
              </button>
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => setCustomSql('SELECT * FROM v_inventory_status WHERE stock_status != \'OK\';')}
              >
                Sample 2: Low Stock View
              </button>
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => setCustomSql('SELECT b.branch_name, COUNT(s.sale_id) AS total_sales, COALESCE(SUM(s.total_amount), 0) AS revenue\nFROM branches b\nLEFT JOIN sales s ON b.branch_id = s.branch_id\nGROUP BY b.branch_id, b.branch_name\nORDER BY revenue DESC;')}
              >
                Sample 3: Revenue Group By
              </button>
            </div>
          </div>

          <form onSubmit={handleExecuteCustom}>
            <textarea
              rows="6"
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              placeholder="SELECT column1, column2 FROM table_name WHERE condition..."
              style={{
                width: '100%',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.9rem',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#0f172a',
                color: '#f8fafc',
                resize: 'vertical',
                marginBottom: '14px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Note: Only SELECT statements are permitted for safety.
              </span>
              <button
                type="submit"
                className="primary-btn"
                disabled={isExecuting || !customSql.trim()}
                style={{ padding: '8px 24px' }}
              >
                {isExecuting ? 'Executing…' : 'Execute SQL'}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="alert error" style={{ marginTop: '16px' }}>
              <strong>SQL Error:</strong> {errorMsg}
            </div>
          )}

          {queryResult && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="tag" style={{ background: '#dcfce7', color: '#166534' }}>
                  {queryResult.row_count} rows returned
                </span>
                {queryResult.execution_time_ms !== undefined && (
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    ⚡ {queryResult.execution_time_ms} ms
                  </span>
                )}
              </div>

              {queryResult.data && queryResult.data.length > 0 ? (
                <div className="table-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        {queryResult.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.data.map((row, idx) => (
                        <tr key={idx}>
                          {queryResult.columns.map((col) => (
                            <td key={col}>{String(row[col] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-box">0 rows returned.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
