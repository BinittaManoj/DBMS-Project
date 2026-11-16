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

const tableRoot = document.getElementById('productsTable');
const productForm = document.getElementById('productForm');
const productMessage = document.getElementById('productMessage');
const productSearch = document.getElementById('productSearch');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');

let products = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function renderProducts(rows) {
  const query = (productSearch?.value || '').toLowerCase();
  const filtered = rows.filter((row) => {
    const text = `${row.product_name || ''} ${row.brand || ''} ${row.drug_schedule || ''}`.toLowerCase();
    return !query || text.includes(query);
  });

  if (!filtered.length) {
    tableRoot.innerHTML = '<div class="alert alert-info">No products found.</div>';
    return;
  }

  tableRoot.innerHTML = `
        <table class="table table-striped table-hover align-middle">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Price</th>
                    <th>Schedule</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map((row) => `
                    <tr>
                        <td>${row.product_id}</td>
                        <td>${escapeHtml(row.product_name)}</td>
                        <td>${escapeHtml(row.brand || '-')}</td>
                        <td>${row.category_id || '-'}</td>
                        <td>${row.supplier_id || '-'}</td>
                        <td>₹${Number(row.unit_price || 0).toFixed(2)}</td>
                        <td>${escapeHtml(row.drug_schedule || 'OTC')}</td>
                        <td>
                            <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${row.product_id}">Edit</button>
                            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${row.product_id}">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

  tableRoot.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);
      if (action === 'edit') {
        const product = products.find((p) => p.product_id === id);
        if (!product) return;
        Object.entries(product).forEach(([key, value]) => {
          const field = productForm.elements.namedItem(key);
          if
