// =============================================================================
// MedMart Branches Management Logic
// =============================================================================

async function loadBranches() {
    const tbody = document.getElementById('branchesTableBody');
    if (!tbody) return;

    try {
        const rows = await fetchJson(`${apiBase}/branches/`);
        if (!rows || rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No branches found.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(r => `
            <tr>
                <td><span class="badge badge-soft-dark">#${r.branch_id}</span></td>
                <td>
                    <div class="fw-bold text-dark">${r.branch_name}</div>
                    <small class="text-muted">${r.email || ''}</small>
                </td>
                <td>
                    <span class="badge badge-soft-info"><i class="bi bi-geo-alt me-1"></i>${r.city}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-person-badge text-muted"></i>
                        <span>${r.manager_name || 'Unassigned'}</span>
                    </div>
                </td>
                <td>
                    <a href="tel:${r.phone}" class="text-decoration-none fw-semibold">
                        <i class="bi bi-telephone me-1 text-primary"></i>${r.phone}
                    </a>
                </td>
                <td>
                    <span class="text-muted small">${r.address}</span>
                </td>
                <td class="text-center">
                    <span class="badge badge-soft-success"><i class="bi bi-check-circle me-1"></i>Operational</span>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Unable to load branches.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', loadBranches);
