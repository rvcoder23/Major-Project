import axios from 'axios';

// Use environment variable in production, fallback to relative path for development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

// Rooms API
export const roomsAPI = {
    getAll: () => api.get('/rooms'),
    getById: (id) => api.get(`/rooms/${id}`),
    create: (data) => api.post('/rooms', data),
    update: (id, data) => api.put(`/rooms/${id}`, data),
    delete: (id) => api.delete(`/rooms/${id}`),
    getAvailable: () => api.get('/rooms/available/rooms'),
    getOccupied: () => api.get('/rooms/occupied/rooms'),
    updateStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
};

// Bookings API
export const bookingsAPI = {
    getAll: () => api.get('/bookings'),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    checkin: (id) => api.post(`/bookings/${id}/checkin`),
    cancel: (id) => api.post(`/bookings/${id}/cancel`),
    noShow: (id) => api.post(`/bookings/${id}/no-show`),
    checkout: (id) => api.patch(`/bookings/${id}/checkout`),
    getTodayCheckins: () => api.get('/bookings/today/checkins'),
    getTodayCheckouts: () => api.get('/bookings/today/checkouts'),
    getPaymentMethods: () => api.get('/bookings/payment-methods'),
};

// Housekeeping API
export const housekeepingAPI = {
    getAll: (params) => api.get('/housekeeping', { params }),
    getById: (id) => api.get(`/housekeeping/${id}`),
    create: (data) => api.post('/housekeeping', data),
    update: (id, data) => api.put(`/housekeeping/${id}`, data),
    updateStatus: (id, status) => api.patch(`/housekeeping/${id}/status`, { status }),
    updateChecklist: (id, checklist) => api.patch(`/housekeeping/${id}/checklist`, { checklist }),
    updateInspection: (id, data) => api.patch(`/housekeeping/${id}/inspect`, data),
    getPending: () => api.get('/housekeeping/pending'),
    getOverdue: () => api.get('/housekeeping/overdue'),
    getTodayReport: () => api.get('/housekeeping/today/report'),
    getDashboardStats: () => api.get('/housekeeping/dashboard/stats'),
    getStaff: () => api.get('/housekeeping/staff/list'),
    getActiveStaff: () => api.get('/housekeeping/staff/active'),
    getStaffById: (id) => api.get(`/housekeeping/staff/${id}`),
    createStaff: (data) => api.post('/housekeeping/staff', data),
    updateStaff: (id, data) => api.put(`/housekeeping/staff/${id}`, data),
    deleteStaff: (id) => api.delete(`/housekeeping/staff/${id}`),
    delete: (id) => api.delete(`/housekeeping/${id}`),
};

// Inventory API
export const inventoryAPI = {
    getAll: () => api.get('/inventory'),
    create: (data) => api.post('/inventory', data),
    update: (id, data) => api.put(`/inventory/${id}`, data),
    delete: (id) => api.delete(`/inventory/${id}`),
    getLowStock: () => api.get('/inventory/low-stock'),
    addStock: (id, data) => api.post(`/inventory/${id}/add-stock`, data),
    getPurchases: () => api.get('/inventory/purchases'),
};

// Accounts API
export const accountsAPI = {
    getAll: () => api.get('/accounts'),
    create: (data) => api.post('/accounts', data),
    update: (id, data) => api.put(`/accounts/${id}`, data),
    delete: (id) => api.delete(`/accounts/${id}`),
    getDailySummary: () => api.get('/accounts/daily-summary'),
    getMonthlySummary: () => api.get('/accounts/monthly-summary'),
    getChartData: (period = '7') => api.get(`/accounts/chart-data?period=${period}`),
};

// Food API
export const foodAPI = {
    getMenu: () => api.get('/food/menu'),
    createMenuItem: (data) => api.post('/food/menu', data),
    updateMenuItem: (id, data) => api.put(`/food/menu/${id}`, data),
    deleteMenuItem: (id) => api.delete(`/food/menu/${id}`),
    getOrders: () => api.get('/food/orders'),
    createOrder: (data) => api.post('/food/orders', data),
    updateOrderStatus: (id, status) => api.patch(`/food/orders/${id}/status`, { status }),
    getTodayOrders: () => api.get('/food/orders/today'),
    getTodayRevenue: () => api.get('/food/revenue/today'),
    getCategories: () => api.get('/food/categories'),
    createBatchOrder: (data) => api.post('/food/orders/batch', data),
    getOrderDetails: (orderNumber) => api.get(`/food/orders/number/${orderNumber}`),
    addItemToOrder: (orderNumber, items) => api.post(`/food/orders/${orderNumber}/add`, { items }),
    deleteOrderItem: (id) => api.delete(`/food/orders/item/${id}`),
};

// Reports API
export const reportsAPI = {
    getDashboard: () => api.get('/reports/dashboard'),
    getDashboardLive: () => api.get('/reports/dashboard/live'),
    getOccupancy: (period = '7') => api.get(`/reports/occupancy?period=${period}`),
    getRevenue: (startDate, endDate) => {
        let qs = '';
        if (startDate && endDate) {
            qs = `?startDate=${startDate}&endDate=${endDate}`;
        }
        return api.get(`/reports/revenue${qs}`);
    },
    getComprehensive: (startDate, endDate) =>
        api.get(`/reports/comprehensive?startDate=${startDate}&endDate=${endDate}`),
};

// Bills API
export const billsAPI = {
    getAll: (params) => api.get('/bills', { params }),
    getById: (id) => api.get(`/bills/${id}`),
    getByInvoiceNumber: (invoiceNumber) => api.get(`/bills/invoice/${invoiceNumber}`),
    generateForBooking: (bookingId, data) => api.post(`/bills/generate/${bookingId}`, data),
    generateForFoodOrder: (orderId, data) => api.post(`/bills/generate/food/${orderId}`, data),
    updatePayment: (id, data) => api.patch(`/bills/${id}/payment`, data),
};

// Settings API
export const settingsAPI = {
    getNotifications: () => api.get('/settings/notifications'),
    updateNotifications: (data) => api.put('/settings/notifications', data),
};

// Meal Plans API
export const mealPlansAPI = {
    getAll: () => api.get('/meal-plans'),
    getByType: (planType) => api.get(`/meal-plans/${planType}`),
    getEntitlements: (bookingId) => api.get(`/meal-plans/${bookingId}/entitlements`),
    checkEligibility: (bookingId, data) => api.post(`/meal-plans/${bookingId}/check-eligibility`, data),
    useEntitlement: (bookingId, data) => api.patch(`/meal-plans/${bookingId}/use-entitlement`, data),
    getSummary: (bookingId) => api.get(`/meal-plans/${bookingId}/summary`),
};

// Staff API
export const staffAPI = {
    getAll: (params) => api.get('/staff', { params }),
    getById: (id) => api.get(`/staff/${id}`),
    create: (data) => api.post('/staff', data),
    update: (id, data) => api.put(`/staff/${id}`, data),
    delete: (id) => api.delete(`/staff/${id}`),
    getByShift: (shiftCode) => api.get(`/staff/shift/${shiftCode}`),
    getCurrentShift: () => api.get('/staff/current/shift'),
};

// Handovers API
export const handoversAPI = {
    getAll: (params) => api.get('/handovers', { params }),
    getCurrent: () => api.get('/handovers/current'),
    generate: (data) => api.post('/handovers/generate', data),
    acknowledge: (id, data) => api.post(`/handovers/${id}/acknowledge`, data),
    getByDate: (date) => api.get(`/handovers/date/${date}`),
};

export default api;
