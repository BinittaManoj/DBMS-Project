const APP_STORAGE_KEY = 'medmart_active_role';

function getRole() {
    return localStorage.getItem(APP_STORAGE_KEY) || 'manager';
}

function setRole(role) {
    const safeRole = (role === 'cashier') ? 'cashier' : 'manager';
    localStorage.setItem(APP_STORAGE_KEY, safeRole);
    document.body.dataset.role = safeRole;
    return safeRole;
}

function setRoleBadge() {
    const role = getRole();
    document.body.dataset.role = role;
    const badge = document.getElementById('roleBadge');
    if (badge) {
        badge.textContent = role === 'cashier' ? 'Cashier View' : 'Manager View';
    }
}

async function apiFetch(url, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || 'Request failed');
    }
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (error) {
        return text;
    }
}

function buildTable(columns, rows, options = {}) {
    if (!rows || rows.length === 0) {
        return '<div class="alert alert-info">No records available.</div>';
    }

    const head = columns.map((c) => `<th>${c.label}</th>`).join('');
    const rowsHtml = rows.map((row) => {
        const cells = columns.map((c) => {
            const value = row[c.key];
            const rendered = c.render ? c.render(value, row) : (value ?? '');
            return `<td>${rendered}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    const extraActions = options.actions ? `<th>Actions</th>` : '';
    const extraCell = options.actions ? rows.map((row) => {
        const actions = options.actions(row).map((action) => `<button class="btn btn-sm btn-light border me-1" data-action="${action.type}" data-id="${row[action.idKey || 'id'] || ''}">${action.label}</button>`).join('');
        return `<td>${actions}</td>`;
    }).join('') : '';

    return `
        <table class="table table-striped table-hover align-middle">
            <thead><tr>${head}${extraActions}</tr></thead>
            <tbody>${rowsHtml}${options.actions ? `<tr>${extraCell}</tr>` : ''}</tbody>
        </table>
    `;
}

function bindTableActions(tableRoot, handler) {
    if (!tableRoot) return;
    tableRoot.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => handler(button.dataset.action, button.dataset.id));
    });
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Request failed');
    }
    return await response.json();
}

function renderTable(rows, columns) {
    if (!rows || rows.length === 0) {
        return '<div class="alert alert-info">No records available.</div>';
    }

    const head = columns.map((c) => `<th>${c.label}</th>`).join('');
    const body = rows.map((row) => {
        const cells = columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    return `
    <table class="table table-striped table-hover">
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  `;
}
