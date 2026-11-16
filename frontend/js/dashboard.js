const apiBase = '/api';

async function loadDashboard() {
    const stats = await fetch(`${apiBase}/analytics/dashboard`).then(r => r.json());

    const cards = [
        { label: 'Total Sales', value: stats.total_sales, className: 'primary' },
        { label: 'Revenue', value: `₹${Number(stats.total_revenue || 0).toLocaleString('en-IN')}`, className: 'success' },
        { label: 'Products', value: stats.total_products, className: 'warning' },
        { label: 'Low Stock', value: stats.low_stock_count, className: 'info' },
    ];

    document.getElementById('statCards').innerHTML = cards.map((card) => `
    <div class="col-md-3"><div class="stat-card ${card.className}"><div>${card.label}</div><h2>${card.value}</h2></div></div>
  `).join('');

    const recentSales = (stats.recent_sales || []).map((row) => `
    <tr><td>${row.invoice_no}</td><td>₹${Number(row.total_amount).toLocaleString('en-IN')}</td><td>${row.sale_date}</td></tr>
  `).join('');
    document.getElementById('recentSalesTable').innerHTML = `<thead><tr><th>Invoice</th><th>Total</th><th>Date</th></tr></thead><tbody>${recentSales || '<tr><td colspan="3">No recent sales</td></tr>'}</tbody>`;

    const branchData = await fetch(`${apiBase}/reports/branch-sales`).then(r => r.json());
    const labels = branchData.map(x => x.branch_name || x.branch_id);
    const revenue = branchData.map(x => Number(x.total_revenue || 0));

    new Chart(document.getElementById('branchChart'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Revenue', data: revenue, backgroundColor: '#3b82f6' }] }
    });

    new Chart(document.getElementById('salesTrendChart'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{ label: 'Sales Trend', data: [12000, 15000, 17000, 19000, 22000, 26000], borderColor: '#10b981', fill: false }]
        }
    });
}

loadDashboard();
