const productForm = document.getElementById('productForm');
const branchForm = document.getElementById('branchForm');
const productMessage = document.getElementById('productMessage');
const branchMessage = document.getElementById('branchMessage');
const inventoryStatus = document.getElementById('inventoryStatus');

async function loadInventoryStatus() {
    try {
        const response = await fetch('/api/inventory/status');
        const rows = await response.json();
        inventoryStatus.innerHTML = `
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Branch</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Reorder</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            <td>${row.branch_name || row.branch_id}</td>
                            <td>${row.product_name}</td>
                            <td>${row.current_quantity}</td>
                            <td>${row.reorder_level}</td>
                            <td>${row.recommendation || 'OK'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        inventoryStatus.innerHTML = '<div class="alert alert-danger">Unable to load inventory status.</div>';
    }
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(productForm);
    const payload = Object.fromEntries(formData.entries());
    payload.unit_price = Number(payload.unit_price);
    payload.cost_price = Number(payload.cost_price);
    payload.category_id = Number(payload.category_id);
    payload.supplier_id = Number(payload.supplier_id);
    payload.is_active = true;

    try {
        const res = await fetch('/api/products/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to add product');
        productMessage.innerHTML = `<div class="alert alert-success">Product added successfully.</div>`;
        productForm.reset();
    } catch (err) {
        productMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
});

branchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(branchForm);
    const payload = Object.fromEntries(formData.entries());
    payload.is_active = true;

    try {
        const res = await fetch('/api/branches/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to add branch');
        branchMessage.innerHTML = `<div class="alert alert-success">Branch added successfully.</div>`;
        branchForm.reset();
    } catch (err) {
        branchMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
});

loadInventoryStatus();
