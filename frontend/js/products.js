// =============================================================================
// MedMart Products Catalog Logic
// =============================================================================

let allCatalogProducts = [];

async function loadProductsCatalog() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        allCatalogProducts = await fetchJson(`${apiBase}/products/`);
        renderProducts(allCatalogProducts);
        updateProductCount(allCatalogProducts.length);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Unable to load product catalog.</td></tr>`;
    }
}

function updateProductCount(count) {
    const badge = document.getElementById('productCountBadge');
    if (badge) {
        badge.innerText = `${count} Products Available`;
    }
}

function renderProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">No products found matching criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const isRx = p.requires_prescription || p.drug_schedule === 'H' || p.drug_schedule === 'X';

        let scheduleBadge = '<span class="badge badge-soft-success">OTC</span>';
        if (p.drug_schedule === 'H') scheduleBadge = '<span class="badge badge-soft-warning">Schedule H</span>';
        if (p.drug_schedule === 'X') scheduleBadge = '<span class="badge badge-soft-danger">Schedule X</span>';

        return `
            <tr>
                <td><span class="badge badge-soft-dark">#${p.product_id}</span></td>
                <td>
                    <div class="fw-bold text-dark">${p.product_name}</div>
                    <small class="text-muted">${p.unit_of_measure || 'STRIP'}</small>
                </td>
                <td>
                    <span class="fw-semibold text-muted">${p.brand || 'Generic'}</span>
                </td>
                <td>${scheduleBadge}</td>
                <td class="text-center">
                    ${isRx 
                        ? `<span class="badge badge-soft-danger"><i class="bi bi-file-earmark-medical me-1"></i>Rx Mandatory</span>` 
                        : `<span class="badge badge-soft-success"><i class="bi bi-bag-check me-1"></i>Over-the-Counter</span>`
                    }
                </td>
                <td class="text-end fw-bold text-dark fs-6">${formatINR(p.unit_price)}</td>
                <td class="text-center">
                    <span class="badge badge-soft-success">Active</span>
                </td>
            </tr>
        `;
    }).join('');
}

function filterProducts() {
    const query = document.getElementById('productsSearchInput')?.value.toLowerCase().trim() || '';
    const schedule = document.getElementById('prodScheduleFilter')?.value || '';

    const filtered = allCatalogProducts.filter(p => {
        const matchesQuery = !query ||
            p.product_name.toLowerCase().includes(query) ||
            (p.brand && p.brand.toLowerCase().includes(query));

        const matchesSchedule = !schedule || p.drug_schedule === schedule;

        return matchesQuery && matchesSchedule;
    });

    renderProducts(filtered);
    updateProductCount(filtered.length);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductsCatalog();

    const searchInput = document.getElementById('productsSearchInput');
    if (searchInput) searchInput.addEventListener('input', filterProducts);

    const scheduleFilter = document.getElementById('prodScheduleFilter');
    if (scheduleFilter) scheduleFilter.addEventListener('change', filterProducts);
});
