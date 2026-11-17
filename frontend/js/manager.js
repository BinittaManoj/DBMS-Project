// =============================================================================
// MedMart Manager Portal Operations Logic
// =============================================================================

async function initManager() {
    await Promise.all([
        loadSuppliersDropdown(),
        loadManagerInventory()
    ]);

    setupManagerForms();
}

// Load Suppliers for Dropdown
async function loadSuppliersDropdown() {
    try {
        const suppliers = await fetchJson(`${apiBase}/suppliers/`);
        const select = document.getElementById('prodSupplierSelect');
        if (select) {
            select.innerHTML = suppliers.map(s => `
                <option value="${s.supplier_id}">${s.supplier_name} (${s.city || 'Vendor'})</option>
            `).join('');
        }
    } catch {
        const select = document.getElementById('prodSupplierSelect');
        if (select) {
            select.innerHTML = `
                <option value="1">MediCore Pharma (Mumbai)</option>
                <option value="2">HealthPlus Labs (Mumbai)</option>
                <option value="3">CityCare Imports (Pune)</option>
            `;
        }
    }
}

// Load Inventory Status
async function loadManagerInventory() {
    const tbody = document.getElementById('managerInventoryTbody');
    if (!tbody) return;

    try {
        const rows = await fetchJson(`${apiBase}/inventory/status`);
        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No inventory alerts found.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(r => {
            const qty = Number(r.current_quantity || 0);
            const reorder = Number(r.reorder_level || 10);
            const isLow = qty <= reorder;

            return `
                <tr>
                    <td class="fw-semibold text-dark">${r.branch_name || `Branch #${r.branch_id}`}</td>
                    <td>
                        <div class="fw-bold">${r.product_name}</div>
                    </td>
                    <td class="text-center">
                        <span class="fs-6 fw-bold ${isLow ? 'text-danger' : 'text-dark'}">${qty}</span>
                    </td>
                    <td class="text-center text-muted">${reorder}</td>
                    <td class="text-center">
                        ${isLow 
                            ? `<span class="badge badge-soft-danger"><i class="bi bi-bell-fill me-1"></i>REORDER REQUIRED</span>`
                            : `<span class="badge badge-soft-success"><i class="bi bi-check-circle me-1"></i>OPTIMAL</span>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Unable to load live inventory status.</td></tr>`;
    }
}

// Setup Manager Forms
function setupManagerForms() {
    // Add Product Form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);
            const payload = Object.fromEntries(formData.entries());

            payload.unit_price = Number(payload.unit_price);
            payload.cost_price = Number(payload.cost_price);
            payload.category_id = Number(payload.category_id);
            payload.supplier_id = Number(payload.supplier_id);
            payload.requires_prescription = document.getElementById('requiresPrescriptionSwitch')?.checked || false;
            payload.is_active = true;

            try {
                const res = await fetch(`${apiBase}/products/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || 'Failed to add product');
                }
                showToast(`Product "${payload.product_name}" added successfully!`, 'success');
                productForm.reset();
            } catch (err) {
                showToast(err.message || 'Error registering product', 'error');
            }
        });
    }

    // Add Branch Form
    const branchForm = document.getElementById('branchForm');
    if (branchForm) {
        branchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(branchForm);
            const payload = Object.fromEntries(formData.entries());
            payload.is_active = true;

            try {
                const res = await fetch(`${apiBase}/branches/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || 'Failed to add branch');
                }
                showToast(`Branch "${payload.branch_name}" registered!`, 'success');
                branchForm.reset();
            } catch (err) {
                showToast(err.message || 'Error creating branch', 'error');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initManager);
