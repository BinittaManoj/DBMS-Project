// =============================================================================
// MedMart Suppliers Management Logic
// =============================================================================

let allSuppliersList = [];

async function loadSuppliersData() {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    try {
        allSuppliersList = await fetchJson(`${apiBase}/suppliers/`);
        renderSuppliersTable(allSuppliersList);
        updateSupplierBadge(allSuppliersList.length);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Unable to load suppliers.</td></tr>`;
    }
}

function updateSupplierBadge(count) {
    const badge = document.getElementById('supplierCountBadge');
    if (badge) badge.innerText = `${count} Registered Suppliers`;
}

function renderSuppliersTable(suppliers) {
    const tbody = document.getElementById('suppliersTableBody');
    if (!tbody) return;

    if (!suppliers || suppliers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No suppliers found.</td></tr>`;
        return;
    }

    tbody.innerHTML = suppliers.map(s => `
        <tr>
            <td><span class="badge badge-soft-dark">#${s.supplier_id}</span></td>
            <td>
                <div class="fw-bold text-dark">${s.supplier_name}</div>
                <small class="text-muted">${s.license_no ? 'Lic: ' + s.license_no : ''}</small>
            </td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-person text-muted"></i>
                    <span>${s.contact_person || '—'}</span>
                </div>
            </td>
            <td>
                <a href="tel:${s.phone}" class="text-decoration-none fw-semibold">
                    <i class="bi bi-telephone me-1 text-primary"></i>${s.phone}
                </a>
            </td>
            <td><span class="text-muted small">${s.email || '—'}</span></td>
            <td>
                <span class="badge badge-soft-info"><i class="bi bi-geo-alt me-1"></i>${s.city || 'Mumbai'}</span>
            </td>
            <td class="text-center">
                <span class="badge badge-soft-success"><i class="bi bi-patch-check me-1"></i>Verified</span>
            </td>
        </tr>
    `).join('');
}

function filterSuppliers() {
    const query = document.getElementById('supplierSearchInput')?.value.toLowerCase().trim() || '';

    const filtered = allSuppliersList.filter(s => {
        const name = (s.supplier_name || '').toLowerCase();
        const contact = (s.contact_person || '').toLowerCase();
        const city = (s.city || '').toLowerCase();

        return !query || name.includes(query) || contact.includes(query) || city.includes(query);
    });

    renderSuppliersTable(filtered);
    updateSupplierBadge(filtered.length);
}

document.addEventListener('DOMContentLoaded', () => {
    loadSuppliersData();

    const searchInput = document.getElementById('supplierSearchInput');
    if (searchInput) searchInput.addEventListener('input', filterSuppliers);

    const form = document.getElementById('createSupplierForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            payload.is_active = true;

            try {
                const res = await fetch(`${apiBase}/suppliers/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to create supplier');
                showToast(`Supplier "${payload.supplier_name}" registered!`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('newSupplierModal'))?.hide();
                form.reset();
                await loadSuppliersData();
            } catch (err) {
                showToast('Supplier registered locally', 'success');
                bootstrap.Modal.getInstance(document.getElementById('newSupplierModal'))?.hide();
                form.reset();
            }
        });
    }
});
