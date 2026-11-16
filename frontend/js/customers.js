fetch('/api/customers/')
    .then((r) => r.json())
    .then((rows) => {
        document.getElementById('customersTable').innerHTML = `
      <table class="table table-striped table-hover">
        <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>City</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${row.customer_id}</td><td>${row.first_name} ${row.last_name}</td><td>${row.phone}</td><td>${row.email || ''}</td><td>${row.city || ''}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
    })
    .catch(() => {
        document.getElementById('customersTable').innerHTML = '<div class="alert alert-danger">Unable to load customers.</div>';
    });
