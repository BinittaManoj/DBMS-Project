const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('medmart_token') : null;
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(url, {
        credentials: 'include',
        headers,
        ...options,
    });

    if (!response.ok) {
        const body = await response.text();
        let detail;
        try {
            const parsed = JSON.parse(body);
            detail = parsed.detail || body;
        } catch {
            detail = body;
        }
        throw new Error(detail || 'Request failed');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// Auth
export async function loginUser(email, password) {
    const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (res && res.access_token && typeof localStorage !== 'undefined') {
        localStorage.setItem('medmart_token', res.access_token);
    }
    return res?.user || res;
}

export function getCurrentUser() {
    return request('/api/auth/me');
}

export async function logoutUser() {
    try {
        await request('/api/auth/logout', {
            method: 'POST',
        });
    } finally {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('medmart_token');
        }
    }
}

// Master Entities
export function getInventoryStatus() {
    return request('/api/inventory/status');
}

export function getProducts() {
    return request('/api/products/');
}

export function getBranches() {
    return request('/api/branches/');
}

export function getCategories() {
    return request('/api/categories/');
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

export function updateProduct(productId, payload) {
    return request(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteProduct(productId) {
    return request(`/api/products/${productId}`, {
        method: 'DELETE',
    });
}

export function createBranch(payload) {
    return request('/api/branches/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateBranch(branchId, payload) {
    return request(`/api/branches/${branchId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteBranch(branchId) {
    return request(`/api/branches/${branchId}`, {
        method: 'DELETE',
    });
}

// Inventory & Stock
export function createInventory(payload) {
    return request('/api/inventory/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function addMedicineToInventory(payload) {
    return request('/api/inventory/add-medicine', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateInventory(branchId, productId, payload) {
    return request(`/api/inventory/${branchId}/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function deleteInventory(branchId, productId) {
    return request(`/api/inventory/${branchId}/${productId}`, {
        method: 'DELETE',
    });
}

export function restockInventory(payload) {
    return request('/api/inventory/restock', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function getLowStockAlerts(branchId, isResolved = false) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (isResolved !== null) params.append('is_resolved', isResolved);
    return request(`/api/inventory/alerts?${params.toString()}`);
}

export function resolveLowStockAlert(alertId) {
    return request(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'POST',
    });
}

// Sales & Billing
export function processSale(payload) {
    return request('/api/sales/process', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function simulateConcurrency(payload) {
    return request('/api/sales/simulate-concurrency', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function getSales(skip = 0, limit = 50, branchId = null) {
    const params = new URLSearchParams({ skip, limit });
    if (branchId) params.append('branch_id', branchId);
    return request(`/api/sales/?${params.toString()}`);
}

export function getRecentSales(limit = 10) {
    return request(`/api/sales/recent?limit=${limit}`);
}

export function getInvoice(invoiceNo) {
    return request(`/api/sales/invoice/${invoiceNo}`);
}

// Analytics & Reports
export function getDashboardStats() {
    return request('/api/analytics/dashboard');
}

export function getDashboardCharts() {
    return request('/api/analytics/charts');
}

export function getMedicineAnalytics(productId) {
    return request(`/api/analytics/medicine/${productId}`);
}

export function getBranchSalesReport() {
    return request('/api/reports/branch-sales');
}

export function getInventoryReport(branchId = null, status = null) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    if (status) params.append('status', status);
    return request(`/api/reports/inventory?${params.toString()}`);
}

// Employees & Staff
export function getEmployees(branchId = null) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return request(`/api/employees/${qs ? `?${qs}` : ''}`);
}

export function getEmployeeSalesReport(branchId = null) {
    const params = new URLSearchParams();
    if (branchId) params.append('branch_id', branchId);
    const qs = params.toString();
    return request(`/api/reports/employee-sales${qs ? `?${qs}` : ''}`);
}

// Query Explorer (Course SQL Baseline)
export function getQueriesCatalog() {
    return request('/api/queries/');
}

export function runQuery(queryKey) {
    return request(`/api/queries/run/${queryKey}`);
}

export function runCustomQuery(sql) {
    return request('/api/queries/execute', {
        method: 'POST',
        body: JSON.stringify({ query: sql }),
    });
}
