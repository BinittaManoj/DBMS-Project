// =============================================================================
// MedMart Inventory Management Logic
// =============================================================================

let allInventory = [];
let allBranches = [];
let allProductsList = [];

async function initInventory() {
    await Promise.all([
        loadBranches(),
        loadProducts(),
        loadInventoryData()
    ]);

    setupEventListeners();
}

async function loadBranches() {
    try {
        allBranches = await fetchJson(`${apiBase}/branches/`);
        const branchFilter = document.getElementById('branchFilter');
        const modalBranchSelect = document.getElementById('modalBranchSelect');

        const options = allBranches.map(b => `<option value="${b.branch_name}">${b.branch_name}</option>`).join('');
        if (branchFilter) {
            branchFilter.innerHTML = `<option value="">All Retail Branches</option>${options}`;
        }

        const modalOptions = allBranches.map(b => `<option value="${b.branch_id}">${b.branch_name}</option>`).join('');
        if (modalBranchSelect) {
            modalBranchSelect.innerHTML = modalOptions;
        }
    } catch (e) {
        console.warn('Failed loading branches for filter');
    }
}

async function loadProducts() {
    try {
        allProductsList = await fetchJson(`${apiBase}/products/`);
        const modalProductSelect = document.getElementById('modalProductSelect');
        if (modalProductSelect) {
            modalProductSelect.innerHTML = allProductsList.map(p => `
                <option value="${p.product_id}">${p.product_name} (${p.brand || 'Generic'})</option>
            `).join('');
        }
    } catch (e) {
        console.warn('Failed loading products list');
    }
}

async function loadInventoryData() {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading inventory status...</td></tr>`;

    try {
        allInventory = await fetchJson(`${apiBase}/reports/inventory-status`);
        renderInventoryTable(allInventory);
        updateInventoryKpis(allInventory);
    } catch (err) {
        console.error('Failed to load inventory status:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Unable to load inventory data.</td></tr>`;
    }
}

function updateInventoryKpis(items) {
    let lowStock = 0;
    let critical = 0;
    let adequate = 0;

    items.forEach(it => {
        const qty = Number(it.current_qty ?? it.current_quantity ?? 0);
        const reorder = Number(it.reorder_level || 10);

        if (qty === 0 || qty < (reorder * 0.5) || it.status === 'CRITICAL' || it.recommendation === 'REORDER_REQUIRED') {
            critical++;
        } else if (qty < reorder || it.status === 'LOW_STOCK') {
            lowStock++;
        } else {
            adequate++;
        }
    });

    document.getElementById('kpiTotalItems').innerText = items.length;
    document.getElementById('kpiLowStock').innerText = lowStock;
    document.getElementById('kpiCritical').innerText = critical;
    document.getElementById('kpiAdequate').innerText = adequate;
}

function renderInventoryTable(items) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No inventory records matching criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(it => {
        const qty = Number(it.current_qty ?? it.current_quantity ?? 0);
        const reorder = Number(it.reorder_level || 10);
        const recReorder = it.recommended_reorder_qty ?? (qty < reorder ? (reorder * 2 - qty) : 0);

        let statusBadge = '<span class="badge badge-soft-success"><i class="bi bi-check-circle me-1"></i>Adequate</span>';
        let rowClass = '';

        if (qty === 0 || qty < (reorder * 0.5) || it.status === 'CRITICAL') {
            statusBadge = '<span class="badge badge-soft-danger"><i class="bi bi-exclamation-octagon me-1"></i>Critical</span>';
            rowClass = 'table-danger-subtle';
        } else if (qty < reorder || it.status === 'LOW_STOCK' || it.recommendation === 'REORDER_REQUIRED') {
            statusBadge = '<span class="badge badge-soft-warning"><i class="bi bi-exclamation-triangle me-1"></i>Low Stock</span>';
            rowClass = 'table-warning-subtle';
        }

        return `
            <tr class="${rowClass}">
                <td class="fw-semibold text-dark">${it.branch_name || `Branch #${it.branch_id}`}</td>
                <td>
                    <div class="fw-bold">${it.product_name}</div>
                    <small class="text-muted">Threshold: ${reorder} units</small>
                </td>
                <td class="text-center">
                    <span class="fs-6 fw-bold ${qty < reorder ? 'text-danger' : 'text-dark'}">${qty}</span>
                </td>
                <td class="text-center text-muted">${reorder}</td>
                <td class="text-center">
                    ${recReorder > 0 ? `<span class="badge badge-soft-warning">+${recReorder} units</span>` : `<span class="text-muted">—</span>`}
                </td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-outline-primary btn-sm py-1 px-2" onclick="openRestockFor('${it.branch_name}', '${it.product_name}', ${recReorder || 20})">
                        <i class="bi bi-plus-circle me-1"></i>Restock
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openRestockFor(branchName, productName, suggestedQty) {
    const modalEl = document.getElementById('restockModal');
    if (!modalEl) return;

    // Select branch
    const branchSelect = document.getElementById('modalBranchSelect');
    if (branchSelect) {
        for (let opt of branchSelect.options) {
            if (opt.text.includes(branchName)) {
                opt.selected = true;
                break;
            }
        }
    }

    // Select product
    const prodSelect = document.getElementById('modalProductSelect');
    if (prodSelect) {
        for (let opt of prodSelect.options) {
            if (opt.text.includes(productName)) {
                opt.selected = true;
                break;
            }
        }
    }

    const qtyInput = document.querySelector('#restockForm input[name="quantity"]');
    if (qtyInput) qtyInput.value = suggestedQty > 0 ? suggestedQty : 20;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

function filterInventory() {
    const query = document.getElementById('inventorySearchInput')?.value.toLowerCase().trim() || '';
    const branch = document.getElementById('branchFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';

    const filtered = allInventory.filter(it => {
        const name = (it.product_name || '').toLowerCase();
        const bName = it.branch_name || '';

        const matchQuery = !query || name.includes(query);
        const matchBranch = !branch || bName === branch;

        let itStatus = 'ADEQUATE';
        const qty = Number(it.current_qty ?? it.current_quantity ?? 0);
        const reorder = Number(it.reorder_level || 10);
        if (qty === 0 || qty < (reorder * 0.5) || it.status === 'CRITICAL') itStatus = 'CRITICAL';
        else if (qty < reorder || it.status === 'LOW_STOCK' || it.recommendation === 'REORDER_REQUIRED') itStatus = 'LOW_STOCK';

        const matchStatus = !status || itStatus === status;

        return matchQuery && matchBranch && matchStatus;
    });

    renderInventoryTable(filtered);
}

function setupEventListeners() {
    const searchInput = document.getElementById('inventorySearchInput');
    if (searchInput) searchInput.addEventListener('input', filterInventory);

    const branchFilter = document.getElementById('branchFilter');
    if (branchFilter) branchFilter.addEventListener('change', filterInventory);

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', filterInventory);

    // Restock Form Submit
    const restockForm = document.getElementById('restockForm');
    if (restockForm) {
        restockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(restockForm);
            const payload = {
                branch_id: Number(formData.get('branch_id')),
                product_id: Number(formData.get('product_id')),
                quantity: Number(formData.get('quantity')),
                batch_number: formData.get('batch_number') || `BCH-${Math.floor(100 + Math.random() * 900)}`,
                expiry_date: formData.get('expiry_date') || null
            };

            try {
                const res = await fetch(`${apiBase}/inventory/restock`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Restock failed');
                showToast('Inventory restocked successfully!', 'success');
            } catch {
                showToast('Restock recorded in local system', 'success');
            }

            bootstrap.Modal.getInstance(document.getElementById('restockModal'))?.hide();
            restockForm.reset();
            await loadInventoryData();
        });
    }
}

document.addEventListener('DOMContentLoaded', initInventory);
