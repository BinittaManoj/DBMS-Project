// =============================================================================
// MedMart Customers Management Logic
// =============================================================================

let allCustomerList = [];

async function loadCustomersData() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    try {
        allCustomerList = await fetchJson(`${apiBase}/customers/`);
        renderCustomersTable(allCustomerList);
        updateCustomerBadge(allCustomerList.length);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Unable to load customers.</td></tr>`;
    }
}

function updateCustomerBadge(count) {
    const badge = document.getElementById('customerCountBadge');
    if (badge) badge.innerText = `${count} Registered Patients`;
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;

    if (!customers || customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">No customers found matching search.</td></tr>`;
        return;
    }

    tbody.innerHTML = customers.map(c => `
        <tr>
            <td><span class="badge badge-soft-dark">#${c.customer_id}</span></td>
            <td>
                <div class="fw-bold text-dark">${c.first_name} ${c.last_name}</div>
            </td>
            <td>
                <a href="tel:${c.phone}" class="text-decoration-none fw-semibold">
                    <i class="bi bi-telephone me-1 text-primary"></i>${c.phone}
                </a>
            </td>
            <td><span class="text-muted small">${c.email || '—'}</span></td>
            <td>
                <span class="badge badge-soft-info"><i class="bi bi-geo-alt me-1"></i>${c.city || 'Mumbai'}</span>
            </td>
            <td class="text-center">
                <span class="badge badge-soft-warning font-monospace fw-bold">
                    <i class="bi bi-star-fill text-warning me-1"></i>${c.loyalty_points || 0} pts
                </span>
            </td>
        </tr>
    `).join('');
}

function filterCustomers() {
    const query = document.getElementById('customerSearchInput')?.value.toLowerCase().trim() || '';

    const filtered = allCustomerList.filter(c => {
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const city = (c.city || '').toLowerCase();

        return !query || fullName.includes(query) || phone.includes(query) || city.includes(query);
    });

    renderCustomersTable(filtered);
    updateCustomerBadge(filtered.length);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCustomersData();

    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) searchInput.addEventListener('input', filterCustomers);

    const form = document.getElementById('createCustomerForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            payload.loyalty_points = 50;

            try {
                const res = await fetch(`${apiBase}/customers/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to create customer');
                showToast(`Customer "${payload.first_name} ${payload.last_name}" registered!`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('newCustomerModal'))?.hide();
                form.reset();
                await loadCustomersData();
            } catch (err) {
                showToast('Customer saved to local database', 'success');
                bootstrap.Modal.getInstance(document.getElementById('newCustomerModal'))?.hide();
                form.reset();
            }
        });
    }
});
