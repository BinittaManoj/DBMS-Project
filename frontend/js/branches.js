fetch('/api/branches/')
    .then((r) => r.json())
    .then((rows) => {
        const tableHTML = `
      <table class="table table-striped table-hover">
        <thead><tr><th>ID</th><th>Name</th><th>City</th><th>Manager</th><th>Phone</th></tr></thead>
        <tbody>
          ${rows.map((row) => `<tr><td>${row.branch_id}</td><td>${row.branch_name}</td><td>${row.city}</td><td>${row.manager_name || ''}</td><td>${row.phone}</td></tr>`).join('')}
        </tbody>
      </table>
    `;
        document.getElementById('branchesTable').innerHTML = tableHTML;
    })
    .catch(() => {
        document.getElementById('branchesTable').innerHTML = '<div class="alert alert-danger">Unable to load branches.</div>';
    });
