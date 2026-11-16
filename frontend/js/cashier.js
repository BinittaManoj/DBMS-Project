const saleForm = document.getElementById('saleForm');
const saleMessage = document.getElementById('saleMessage');
const customersTable = document.getElementById('customersTable');
const cashierSearch = document.getElementById('cashierSearch');

let customerRows = [];

function renderCustomers(rows) {
    const query = (cashierSearch?.value || '').toLowerCase();
    const filtered = !query ? rows : rows.filter((row) => {
        const text = `${row.first_name || ''} ${row.last_name || ''} ${row.phone || ''} ${row.city || ''}`.toLowerCase();
        return text.includes(query);
    });

    if (!filtered.length) {
        customersTable.innerHTML = '<div class="alert alert-info">No matching customers.</div>';
        return;
    }

    customersTable.innerHTML = `
        <table class="table table-striped table-hover">
            <thead>
                <tr><th>ID</th><th>Name</th><th>Phone</th><th>City</th></tr>
            </thead>
            <tbody>
                ${filtered.map(row => `
                    <tr>
                        <td>${row.customer_id}</td>
                        <td>${row.first_name} ${row.last_name}</td>
                        <td>${row.phone}</td>
                        <td>${row.city || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadCustomers() {
    try {
        customerRows = await apiFetch('/api/customers/') || [];
        renderCustomers(customerRows);
    } catch (error) {
        customersTable.innerHTML = '<div class="alert alert-danger">Unable to load customers.</div>';
    }
}

saleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(saleForm);
    const payload = Object.fromEntries(formData.entries());
    payload.branch_id = Number(payload.branch_id);
    payload.customer_id = payload.customer_id ? Number(payload.customer_id) : null;
    payload.employee_id = Number(payload.employee_id);
    payload.discount = Number(payload.discount || 0);
    payload.items = JSON.parse(payload.items);

    try {
        const data = await apiFetch('/api/sales/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        saleMessage.innerHTML = `<div class="alert alert-success">Sale processed successfully. Invoice: ${data.invoice_no || 'created'}</div>`;
        saleForm.reset();
        loadCustomers();
    } catch (err) {
        saleMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
});

cashierSearch?.addEventListener('input', () => renderCustomers(customerRows));
setRoleBadge();
loadCustomers();
