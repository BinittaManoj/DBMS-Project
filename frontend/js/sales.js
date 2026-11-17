// =============================================================================
// MedMart Sales & Billing History Logic
// =============================================================================

let allSales = [];

async function loadSalesHistory() {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted"><span class="spinner-border spinner-border-sm me-2"></span>Loading sales records...</td></tr>`;

    try {
        allSales = await fetchJson(`${apiBase}/sales/`);
        renderSalesTable(allSales);
        updateSummaryMetrics(allSales);
    } catch (err) {
        console.error('Failed to load sales history:', err);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Unable to load transactions ledger.</td></tr>`;
    }
}

function updateSummaryMetrics(sales) {
    const totalRev = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const count = sales.length;
    const avg = count > 0 ? (totalRev / count) : 0;

    const revEl = document.getElementById('summaryTotalRevenue');
    const billsEl = document.getElementById('summaryTotalBills');
    const avgEl = document.getElementById('summaryAvgBill');

    if (revEl) revEl.innerText = formatINR(totalRev);
    if (billsEl) billsEl.innerText = count.toLocaleString('en-IN');
    if (avgEl) avgEl.innerText = formatINR(avg);
}

function renderSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;

    if (!sales || sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">No sales transactions found matching criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = sales.map(s => {
        let paymentBadge = '<span class="badge badge-soft-dark">CASH</span>';
        if (s.payment_method === 'UPI') {
            paymentBadge = '<span class="badge badge-soft-info"><i class="bi bi-qr-code me-1"></i>UPI</span>';
        } else if (s.payment_method === 'CARD') {
            paymentBadge = '<span class="badge badge-soft-purple"><i class="bi bi-credit-card me-1"></i>CARD</span>';
        } else if (s.payment_method === 'INSURANCE') {
            paymentBadge = '<span class="badge badge-soft-warning"><i class="bi bi-shield-check me-1"></i>INSURANCE</span>';
        } else if (s.payment_method === 'CASH') {
            paymentBadge = '<span class="badge badge-soft-success"><i class="bi bi-cash me-1"></i>CASH</span>';
        }

        return `
            <tr>
                <td>
                    <span class="badge badge-soft-primary font-monospace fw-bold">
                        ${s.invoice_no}
                    </span>
                </td>
                <td>
                    <span class="fw-semibold text-dark">${s.branch_name || `Branch #${s.branch_id}`}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-person text-muted"></i>
                        <span>${s.customer_name || 'Walk-in Customer'}</span>
                    </div>
                </td>
                <td>
                    <span class="text-muted small">${s.employee_name || 'Staff'}</span>
                </td>
                <td class="text-muted small">${formatDate(s.sale_date)}</td>
                <td class="text-center">${paymentBadge}</td>
                <td class="text-end fw-bold text-dark fs-6">${formatINR(s.total_amount)}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-outline-primary btn-sm py-1 px-2" onclick="viewSaleInvoice('${s.invoice_no}', ${s.total_amount}, '${s.sale_date}', '${s.branch_name || 'Branch'}', '${s.customer_name || 'Walk-in'}', '${s.payment_method}')">
                        <i class="bi bi-receipt me-1"></i>View Bill
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewSaleInvoice(invoiceNo, amount, date, branchName, customerName, paymentMethod) {
    try {
        const fullInvoice = await fetchJson(`${apiBase}/sales/invoice/${invoiceNo}`);
        showInvoiceModal(fullInvoice);
    } catch {
        // Fallback modal
        showInvoiceModal({
            invoice_no: invoiceNo,
            total_amount: amount,
            sale_date: date,
            branch_name: branchName,
            customer_name: customerName,
            payment_method: paymentMethod,
            items: [
                { product_name: 'Pharmacy Prescription & OTC Items', quantity: 1, unit_price: amount, subtotal: amount }
            ]
        });
    }
}

function filterSales() {
    const query = document.getElementById('salesSearchInput')?.value.toLowerCase().trim() || '';
    const payment = document.getElementById('paymentFilter')?.value || '';

    const filtered = allSales.filter(s => {
        const matchQuery = !query ||
            s.invoice_no.toLowerCase().includes(query) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(query)) ||
            (s.employee_name && s.employee_name.toLowerCase().includes(query)) ||
            (s.branch_name && s.branch_name.toLowerCase().includes(query));

        const matchPayment = !payment || s.payment_method === payment;
        return matchQuery && matchPayment;
    });

    renderSalesTable(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    loadSalesHistory();

    const searchInput = document.getElementById('salesSearchInput');
    if (searchInput) searchInput.addEventListener('input', filterSales);

    const paymentFilter = document.getElementById('paymentFilter');
    if (paymentFilter) paymentFilter.addEventListener('change', filterSales);
});
