const API_BASE_URL = 'http://127.0.0.1:8000';

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'Request failed');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export function getInventoryStatus() {
    return request('/api/inventory/status');
}

export function getProducts() {
    return request('/api/products/');
}

export function getBranches() {
    return request('/api/branches/');
}

export function getSuppliers() {
    return request('/api/suppliers/');
}

export function getCustomers() {
    return request('/api/customers/');
}

export function createProduct(payload) {
    return request('/api/products/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function createBranch(payload) {
    return request('/api/branches/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function restockInventory(payload) {
    return request('/api/inventory/restock', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function processSale(payload) {
    return request('/api/sales/process', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
