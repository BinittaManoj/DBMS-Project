// =============================================================================
// MedMart Common Utilities & UI Helpers
// =============================================================================

const apiBase = '/api';

// Currency Formatter
function formatINR(amount) {
    const num = Number(amount || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Date Formatter
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
}

// Custom Toast Notification
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;

    let icon = 'bi-info-circle-fill text-primary';
    if (type === 'success') icon = 'bi-check-circle-fill text-success';
    if (type === 'error') icon = 'bi-exclamation-octagon-fill text-danger';
    if (type === 'warning') icon = 'bi-exclamation-triangle-fill text-warning';

    toast.innerHTML = `
        <i class="bi ${icon} fs-4"></i>
        <div class="flex-grow-1">
            <div class="fw-semibold text-capitalize">${type}</div>
            <div class="text-muted small">${message}</div>
        </div>
        <button type="button" class="btn-close btn-sm" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// Fallback demo data if backend database is offline during UI testing
const mockFallbacks = {
    '/api/analytics/dashboard': {
        total_sales: 142,
        total_revenue: 184500.00,
        total_products: 48,
        total_branches: 3,
        total_customers: 65,
        low_stock_count: 4,
        recent_sales: [
            { invoice_no: 'INV-20261116-0001', total_amount: 1450.00, sale_date: new Date().toISOString(), branch_id: 1, customer_name: 'Aisha Patel' },
            { invoice_no: 'INV-20261116-0002', total_amount: 890.00, sale_date: new Date(Date.now() - 3600000).toISOString(), branch_id: 1, customer_name: 'Rohit Sharma' },
            { invoice_no: 'INV-20261116-0003', total_amount: 2400.00, sale_date: new Date(Date.now() - 7200000).toISOString(), branch_id: 2, customer_name: 'Priya Menon' },
            { invoice_no: 'INV-20261116-0004', total_amount: 620.00, sale_date: new Date(Date.now() - 10800000).toISOString(), branch_id: 3, customer_name: 'Sandeep Kale' },
            { invoice_no: 'INV-20261116-0005', total_amount: 3100.00, sale_date: new Date(Date.now() - 14400000).toISOString(), branch_id: 2, customer_name: 'Meera Iyer' }
        ]
    },
    '/api/reports/branch-sales': [
        { branch_id: 1, branch_name: 'MedMart Andheri', city: 'Mumbai', total_transactions: 78, total_revenue: 95400.00 },
        { branch_id: 2, branch_name: 'MedMart Dadar', city: 'Mumbai', total_transactions: 42, total_revenue: 56300.00 },
        { branch_id: 3, branch_name: 'MedMart Pune', city: 'Pune', total_transactions: 22, total_revenue: 32800.00 }
    ],
    '/api/branches/': [
        { branch_id: 1, branch_name: 'MedMart Andheri', address: '12 Link Road, Andheri West', city: 'Mumbai', phone: '9876501111', email: 'andheri@medmart.in', manager_name: 'Riya Shah', is_active: true },
        { branch_id: 2, branch_name: 'MedMart Dadar', address: '88 Shivaji Park Road, Dadar', city: 'Mumbai', phone: '9876502222', email: 'dadar@medmart.in', manager_name: 'Vikram Desai', is_active: true },
        { branch_id: 3, branch_name: 'MedMart Pune', address: '21 FC Road, Pune', city: 'Pune', phone: '9876503333', email: 'pune@medmart.in', manager_name: 'Ananya Joshi', is_active: true }
    ],
    '/api/products/': [
        { product_id: 1, product_name: 'Paracetamol 500mg', brand: 'Cipla', category_id: 1, supplier_id: 1, unit_price: 18.00, cost_price: 11.50, drug_schedule: 'OTC', requires_prescription: false },
        { product_id: 2, product_name: 'Ibuprofen 200mg', brand: 'Mankind', category_id: 1, supplier_id: 1, unit_price: 24.00, cost_price: 15.00, drug_schedule: 'OTC', requires_prescription: false },
        { product_id: 3, product_name: 'Cough Syrup 100ml', brand: 'Dabur', category_id: 2, supplier_id: 2, unit_price: 85.00, cost_price: 52.00, drug_schedule: 'OTC', requires_prescription: false },
        { product_id: 4, product_name: 'Vitamin C Tablets', brand: 'Zenith', category_id: 3, supplier_id: 2, unit_price: 140.00, cost_price: 95.00, drug_schedule: 'OTC', requires_prescription: false },
        { product_id: 5, product_name: 'Antiseptic Cream', brand: 'Dettol', category_id: 4, supplier_id: 3, unit_price: 70.00, cost_price: 45.00, drug_schedule: 'OTC', requires_prescription: false },
        { product_id: 6, product_name: 'Bandage Roll', brand: 'Curad', category_id: 5, supplier_id: 3, unit_price: 45.00, cost_price: 28.00, drug_schedule: 'OTC', requires_prescription: false },
        { product_id: 7, product_name: 'Antacid Tablets', brand: 'Digene', category_id: 6, supplier_id: 4, unit_price: 52.00, cost_price: 34.00, drug_schedule: 'OTC', requires_prescription: false },
        { product_id: 8, product_name: 'Amoxicillin 500mg', brand: 'Apex', category_id: 10, supplier_id: 1, unit_price: 160.00, cost_price: 100.00, drug_schedule: 'H', requires_prescription: true }
    ],
    '/api/customers/': [
        { customer_id: 1, first_name: 'Aisha', last_name: 'Patel', phone: '9000000001', email: 'aisha.patel@example.com', city: 'Mumbai', loyalty_points: 120 },
        { customer_id: 2, first_name: 'Rohit', last_name: 'Sharma', phone: '9000000002', email: 'rohit.sharma@example.com', city: 'Mumbai', loyalty_points: 90 },
        { customer_id: 3, first_name: 'Priya', last_name: 'Menon', phone: '9000000003', email: 'priya.menon@example.com', city: 'Pune', loyalty_points: 145 },
        { customer_id: 4, first_name: 'Sandeep', last_name: 'Kale', phone: '9000000004', email: 'sandeep.kale@example.com', city: 'Mumbai', loyalty_points: 80 },
        { customer_id: 5, first_name: 'Meera', last_name: 'Iyer', phone: '9000000005', email: 'meera.iyer@example.com', city: 'Mumbai', loyalty_points: 60 }
    ],
    '/api/suppliers/': [
        { supplier_id: 1, supplier_name: 'MediCore Pharma', contact_person: 'Arun Nair', phone: '9820012345', email: 'arun@medicore.in', city: 'Mumbai', gstin: '27AAAA0001A1Z1' },
        { supplier_id: 2, supplier_name: 'HealthPlus Labs', contact_person: 'Neha Mehta', phone: '9820012346', email: 'neha@healthplus.in', city: 'Mumbai', gstin: '27BBBB0002B2Z2' },
        { supplier_id: 3, supplier_name: 'CityCare Imports', contact_person: 'Sanjay Jadhav', phone: '9820012347', email: 'sanjay@citycare.in', city: 'Pune', gstin: '27CCCC0003C3Z3' }
    ],
    '/api/inventory/status': [
        { branch_id: 1, branch_name: 'MedMart Andheri', product_name: 'Paracetamol 500mg', current_quantity: 28, reorder_level: 15, recommendation: 'OK' },
        { branch_id: 1, branch_name: 'MedMart Andheri', product_name: 'Vitamin C Tablets', current_quantity: 6, reorder_level: 10, recommendation: 'REORDER_REQUIRED' },
        { branch_id: 2, branch_name: 'MedMart Dadar', product_name: 'Cough Syrup 100ml', current_quantity: 4, reorder_level: 12, recommendation: 'REORDER_REQUIRED' },
        { branch_id: 3, branch_name: 'MedMart Pune', product_name: 'Bandage Roll', current_quantity: 14, reorder_level: 10, recommendation: 'OK' }
    ],
    '/api/reports/inventory-status': [
        { branch_name: 'MedMart Andheri', product_name: 'Paracetamol 500mg', current_qty: 28, reorder_level: 15, recommended_reorder_qty: 0, status: 'ADEQUATE' },
        { branch_name: 'MedMart Andheri', product_name: 'Vitamin C Tablets', current_qty: 6, reorder_level: 10, recommended_reorder_qty: 20, status: 'LOW_STOCK' },
        { branch_name: 'MedMart Dadar', product_name: 'Cough Syrup 100ml', current_qty: 4, reorder_level: 12, recommended_reorder_qty: 25, status: 'CRITICAL' },
        { branch_name: 'MedMart Dadar', product_name: 'Antacid Tablets', current_qty: 18, reorder_level: 8, recommended_reorder_qty: 0, status: 'ADEQUATE' },
        { branch_name: 'MedMart Pune', product_name: 'Amoxicillin 500mg', current_qty: 5, reorder_level: 10, recommended_reorder_qty: 15, status: 'LOW_STOCK' }
    ],
    '/api/sales/': [
        { sale_id: 1, invoice_no: 'INV-20261116-0001', branch_name: 'MedMart Andheri', customer_name: 'Aisha Patel', employee_name: 'Yash Mhatre', sale_date: new Date().toISOString(), total_amount: 1450.00, payment_method: 'UPI', items_count: 3 },
        { sale_id: 2, invoice_no: 'INV-20261116-0002', branch_name: 'MedMart Andheri', customer_name: 'Rohit Sharma', employee_name: 'Yash Mhatre', sale_date: new Date(Date.now() - 3600000).toISOString(), total_amount: 890.00, payment_method: 'CASH', items_count: 2 },
        { sale_id: 3, invoice_no: 'INV-20261116-0003', branch_name: 'MedMart Dadar', customer_name: 'Priya Menon', employee_name: 'Sneha Verma', sale_date: new Date(Date.now() - 7200000).toISOString(), total_amount: 2400.00, payment_method: 'CARD', items_count: 4 },
        { sale_id: 4, invoice_no: 'INV-20261116-0004', branch_name: 'MedMart Pune', customer_name: 'Sandeep Kale', employee_name: 'Manav Shinde', sale_date: new Date(Date.now() - 10800000).toISOString(), total_amount: 620.00, payment_method: 'UPI', items_count: 1 }
    ]
};

// Resilient API Fetcher
async function fetchJson(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.warn(`Fetch to ${url} failed, checking demo fallback:`, err.message);
        if (mockFallbacks[url]) {
            return mockFallbacks[url];
        }
        throw err;
    }
}

// Table Search & Filter Helper
function setupTableSearch(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (!input || !table) return;

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// Live Topbar Clock
function initTopbarClock() {
    const clockEl = document.getElementById('liveClock');
    if (!clockEl) return;

    function update() {
        const now = new Date();
        clockEl.innerText = now.toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    update();
    setInterval(update, 30000);
}

// Mobile Sidebar Toggle
function initMobileSidebar() {
    const toggleBtn = document.getElementById('mobileSidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

// Show Printable Invoice Modal
function showInvoiceModal(invoice) {
    let modalEl = document.getElementById('invoiceModal');
    if (!modalEl) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="modal fade" id="invoiceModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header bg-light">
                            <h5 class="modal-title fw-bold text-primary">
                                <i class="bi bi-receipt me-2"></i>Tax Invoice & Receipt
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4" id="invoiceModalBody"></div>
                        <div class="modal-footer bg-light no-print">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onclick="window.print()">
                                <i class="bi bi-printer me-2"></i>Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper.firstElementChild);
        modalEl = document.getElementById('invoiceModal');
    }

    const modalBody = document.getElementById('invoiceModalBody');
    const items = invoice.items || [];
    
    modalBody.innerHTML = `
        <div id="printableInvoice" class="invoice-slip">
            <div class="invoice-header">
                <h2>MedMart Pharmacy Chain</h2>
                <div class="text-muted small">Quality Healthcare & Medical Retail</div>
                <div class="text-muted small">GSTIN: 27ABCDE1234F1Z5 | License: DL-MH-2024-001</div>
            </div>
            
            <div class="row g-2 mb-3 small">
                <div class="col-6">
                    <div><strong>Invoice No:</strong> <span class="text-primary fw-bold">${invoice.invoice_no || 'INV-PENDING'}</span></div>
                    <div><strong>Date & Time:</strong> ${formatDate(invoice.sale_date || new Date())}</div>
                    <div><strong>Branch:</strong> ${invoice.branch_name || 'MedMart Main Branch'}</div>
                </div>
                <div class="col-6 text-end">
                    <div><strong>Customer:</strong> ${invoice.customer_name || 'Walk-in Customer'}</div>
                    <div><strong>Payment Method:</strong> <span class="badge bg-secondary">${invoice.payment_method || 'CASH'}</span></div>
                    ${invoice.prescription_no ? `<div><strong>Rx No:</strong> ${invoice.prescription_no}</div>` : ''}
                </div>
            </div>

            <div class="table-responsive mb-3">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>#</th>
                            <th>Item Description</th>
                            <th class="text-center">Qty</th>
                            <th class="text-end">Price</th>
                            <th class="text-end">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map((it, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${it.product_name || `Product #${it.product_id}`}</td>
                                <td class="text-center">${it.quantity}</td>
                                <td class="text-end">${formatINR(it.unit_price)}</td>
                                <td class="text-end fw-semibold">${formatINR(it.subtotal || (it.quantity * it.unit_price))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="row justify-content-end">
                <div class="col-md-6">
                    <div class="d-flex justify-content-between py-1 small">
                        <span>Subtotal:</span>
                        <span>${formatINR(invoice.subtotal || invoice.total_amount || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-1 small">
                        <span>Discount:</span>
                        <span>- ${formatINR(invoice.discount || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-1 small">
                        <span>Tax (GST Included):</span>
                        <span>${formatINR(invoice.tax_amount || 0)}</span>
                    </div>
                    <div class="d-flex justify-content-between py-2 border-top border-bottom border-dark fw-bold fs-5 text-primary">
                        <span>Net Payable:</span>
                        <span>${formatINR(invoice.total_amount || 0)}</span>
                    </div>
                </div>
            </div>

            <div class="text-center mt-4 pt-3 border-top text-muted small">
                <p class="mb-1">Thank you for choosing MedMart! Get well soon.</p>
                <p class="mb-0 text-muted" style="font-size: 0.7rem;">Goods once sold can be returned within 7 days with original invoice.</p>
            </div>
        </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

// Global Init on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initTopbarClock();
    initMobileSidebar();
});
