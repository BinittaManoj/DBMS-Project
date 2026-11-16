fetch('/api/suppliers/')
    .then((r) => r.json())
    .then((rows) => {
        document.getElementById('suppliersTable').innerHTML = `
      <table class="table table-striped table-hover">
        <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Phone</th><th>City</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${row.supplier_id}</td><td>${row.supplier_name}</td><td>${row.contact_person || ''}</td><td>${row.phone}</td><td>${row.city || ''}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    })
    .catch(() => {
        document.getElementById('suppliersTable').innerHTML = '<div class="alert alert-danger">Unable to load suppliers.</div>';
    });
