export const dashboardStats = [
    { label: 'Revenue', value: '₹48.2K', change: '+12.4%', tone: 'positive' },
    { label: 'Orders', value: '1,284', change: '+8.1%', tone: 'positive' },
    { label: 'Low Stock', value: '14', change: '-3.2%', tone: 'warning' },
    { label: 'Active Cashiers', value: '09', change: '+2', tone: 'neutral' },
];

export const inventoryRows = [
    { product: 'Paracetamol 500mg', branch: 'Central Branch', stock: 128, reorder: 40, status: 'Healthy' },
    { product: 'Cough Syrup', branch: 'Old City', stock: 26, reorder: 45, status: 'Low' },
    { product: 'Vitamin C', branch: 'Lakeview', stock: 90, reorder: 30, status: 'Healthy' },
    { product: 'Insulin Pen', branch: 'Mall Road', stock: 18, reorder: 20, status: 'Critical' },
    { product: 'Antacid', branch: 'North Plaza', stock: 62, reorder: 25, status: 'Healthy' },
];

export const recentSales = [
    { product: 'Vitamin C', qty: 14, revenue: '₹3,450', cashier: 'Nisha' },
    { product: 'Paracetamol', qty: 18, revenue: '₹2,210', cashier: 'Ravi' },
    { product: 'Cough Syrup', qty: 9, revenue: '₹1,980', cashier: 'Sana' },
    { product: 'Antacid', qty: 11, revenue: '₹1,760', cashier: 'Arjun' },
];

export const quickActions = [
    'Add product',
    'Create supplier',
    'Restock branch',
    'Generate sales report',
    'Review alerts',
];

export const branchHealth = [
    { name: 'Central Branch', share: 92 },
    { name: 'Old City', share: 74 },
    { name: 'Lakeview', share: 88 },
    { name: 'Mall Road', share: 67 },
];
