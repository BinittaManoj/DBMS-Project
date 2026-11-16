const saleForm = document.getElementById('saleForm');
const saleMessage = document.getElementById('saleMessage');
const customersTable = document.getElementById('customersTable');

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers/');
        const rows = await response.json();
        customersTable.innerHTML = `
            <table class="table table-striped table-hover">
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Phone</th><th>City</th></tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
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
        const res = await fetch('/api/sales/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Sale failed');
        saleMessage.innerHTML = `<div class="alert alert-success">Sale processed successfully. Invoice: ${data.invoice_no || 'created'}</div>`;
        saleForm.reset();
        loadCustomers();
    } catch (err) {
        saleMessage.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
    }
});

loadCustomers();
