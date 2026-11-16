const productForm = document.getElementById('productForm');
const branchForm = document.getElementById('branchForm');
const productMessage = document.getElementById('productMessage');
const branchMessage = document.getElementById('branchMessage');
const inventoryStatus = document.getElementById('inventoryStatus');
const managerSearch = document.getElementById('managerSearch');

const managerUser = requireLogin(['manager']);
if (!managerUser) {
    throw new Error('Manager login required');
}

let inventoryRows = [];

function renderInventory(rows) {
    const filtered = rows.filter((row) => {
        const text = `${row.branch_name || ''} ${row.product_name || ''} ${row.recommendation || ''}`.toLowerCase();
        const query = (managerSearch?.value || '').toLowerCase();
        return !query || text.includes(query);
    });

    if (!filtered.length) {
        inventoryStatus.innerHTML = '<div class="alert alert-info">No matching inventory found.</div>';
        return;
    }

    inventoryStatus.innerHTML = `
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>Branch</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Reorder</th>
                    <th>Status</th>
                    <th>Qty to add</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(row => `
                    <tr>
                        <td>${row.branch_name || row.branch_id}</td>
                        <td>${row.product_name}</td>
                        <td>${row.current_quantity}</td>
                        <td>${row.reorder_level}</td>
                        <td>${row.recommendation || 'OK'}</td>
                        <td>
                            <input class="form-control form-control-sm" type="number" min="1" value="25" data-restock-qty="${row.product_id}-${row.branch_id}" />
                        </td>
                        <td><button class="btn btn-sm btn-outline-danger" data-restock="${row.product_id}" data-branch="${row.branch_id}">Restock</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    inventoryStatus.querySelectorAll('[data-restock]').forEach((button) => {
        button.addEventListener('click', async () => {
            const productId = Number(button.dataset.restock);
            const branchId = Number(button.dataset.branch);
            const quantityInput = inventoryStatus.querySelector(`[data-restock-qty="${productId}-${branchId}"]`);
            const quantity = Number(quantityInput?.value || 25);

            if (!quantity || quantity <= 0) {
                productMessage.innerHTML = '<div class="alert alert-warning">Restock quantity must be greater than 0.</div>';
                return;
            }

            try {
                await apiFetch('/api/inventory/restock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ branch_id: branchId, product_id: productId, quantity })
                });
                productMessage.innerHTML = `<div class="alert alert-success">Restocked ${quantity} units successfully.</div>`;
                loadInventoryStatus();
            } catch (err) {
                productMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
            }
        });
    });
}

async function loadInventoryStatus() {
    try {
        const rows = await apiFetch('/api/inventory/status');
        inventoryRows = rows || [];
        renderInventory(inventoryRows);
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
        await apiFetch('/api/products/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        productMessage.innerHTML = '<div class="alert alert-success">Product added successfully.</div>';
        productForm.reset();
        loadInventoryStatus();
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
        await apiFetch('/api/branches/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        branchMessage.innerHTML = '<div class="alert alert-success">Branch added successfully.</div>';
        branchForm.reset();
    } catch (err) {
        branchMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
});

managerSearch?.addEventListener('input', () => renderInventory(inventoryRows));
setRoleBadge();
loadInventoryStatus();
