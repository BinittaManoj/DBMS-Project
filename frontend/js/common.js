const APP_STORAGE_KEY = 'medmart_active_role';
const APP_SESSION_KEY = 'medmart_user_session';

const DEMO_USERS = {
    manager: { username: 'manager', password: 'manager123', role: 'manager', name: 'Store Manager' },
    cashier1: { username: 'cashier1', password: 'cashier123', role: 'cashier', name: 'Cashier 1' },
    cashier2: { username: 'cashier2', password: 'cashier123', role: 'cashier', name: 'Cashier 2' },
    cashier3: { username: 'cashier3', password: 'cashier123', role: 'cashier', name: 'Cashier 3' }
};

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(APP_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function loginUser(user) {
    localStorage.setItem(APP_SESSION_KEY, JSON.stringify(user));
    localStorage.setItem(APP_STORAGE_KEY, user.role);
}

function logoutUser() {
    localStorage.removeItem(APP_SESSION_KEY);
    localStorage.removeItem(APP_STORAGE_KEY);
    window.location.href = '/login.html';
}

function requireLogin(allowedRoles = []) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '/login.html';
        return null;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        window.location.href = user.role === 'manager' ? '/manager.html' : '/cashier.html';
        return null;
    }
    return user;
}

function getRole() {
    return localStorage.getItem(APP_STORAGE_KEY) || getCurrentUser()?.role || 'manager';
}

function setRole(role) {
    const safeRole = (role === 'cashier') ? 'cashier' : 'manager';
    localStorage.setItem(APP_STORAGE_KEY, safeRole);
    document.body.dataset.role = safeRole;
    return safeRole;
}

function setRoleBadge() {
    const user = getCurrentUser();
    const role = getRole();
    document.body.dataset.role = role;

    const badge = document.getElementById('roleBadge');
    if (badge) {
        badge.textContent = role === 'cashier' ? 'Cashier View' : 'Manager View';
    }

    const userLabel = document.getElementById('userLabel');
    if (userLabel && user) {
        userLabel.textContent = `${user.name} • ${user.role.toUpperCase()}`;
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
