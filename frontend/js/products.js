fetch('/api/products/')
    .then((r) => r.json())
    .then((rows) => {
        const html = `
      <table class="table table-striped table-hover">
        <thead><tr><th>ID</th><th>Name</th><th>Brand</th><th>Price</th><th>Schedule</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${row.product_id}</td><td>${row.product_name}</td><td>${row.brand || ''}</td><td>₹${Number(row.unit_price).toFixed(2)}</td><td>${row.drug_schedule || ''}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
        document.getElementById('productsTable').innerHTML = html;
    })
    .catch(() => {
        document.getElementById('productsTable').innerHTML = '<div class="alert alert-danger">Unable to load products.</div>';
    });
