import axios from 'axios';

const API_BASE_URL = '/api';

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
    updateStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
};

// Bookings API
export const bookingsAPI = {
    getAll: () => api.get('/bookings'),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    cancel: (id) => api.patch(`/bookings/${id}/cancel`),
    checkout: (id) => api.patch(`/bookings/${id}/checkout`),
    getTodayCheckins: () => api.get('/bookings/today/checkins'),
    getTodayCheckouts: () => api.get('/bookings/today/checkouts'),
};

// Housekeeping API
export const housekeepingAPI = {
    getAll: () => api.get('/housekeeping'),
    create: (data) => api.post('/housekeeping', data),
    updateStatus: (id, status) => api.patch(`/housekeeping/${id}/status`, { status }),
    getPending: () => api.get('/housekeeping/pending'),
    getTodayReport: () => api.get('/housekeeping/today/report'),
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
    getDailySummary: () => api.get('/accounts/daily-summary'),
    getMonthlySummary: () => api.get('/accounts/monthly-summary'),
    getChartData: (period = '7') => api.get(`/accounts/chart-data?period=${period}`),
};

// Reports API
export const reportsAPI = {
    getDashboard: () => api.get('/reports/dashboard'),
    getOccupancy: (period = '7') => api.get(`/reports/occupancy?period=${period}`),
    getRevenue: () => api.get('/reports/revenue'),
    getComprehensive: (startDate, endDate) =>
        api.get(`/reports/comprehensive?startDate=${startDate}&endDate=${endDate}`),
};

export default api;
