fetch('/api/reports/inventory-status')
    .then((r) => r.json())
    .then((rows) => {
        document.getElementById('inventoryTable').innerHTML = `
      <table class="table table-striped table-hover">
        <thead><tr><th>Branch</th><th>Product</th><th>Qty</th><th>Reorder</th><th>Recommended</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${row.branch_name}</td><td>${row.product_name}</td><td>${row.current_qty}</td><td>${row.reorder_level}</td><td>${row.recommended_reorder_qty}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    })
    .catch(() => {
        document.getElementById('inventoryTable').innerHTML = '<div class="alert alert-danger">Unable to load inventory.</div>';
    });
