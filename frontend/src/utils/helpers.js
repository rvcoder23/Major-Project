import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `ORD-${timestamp}-${random}`;
}

export function generateInvoiceNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `INV-${timestamp}-${random}`;
}

export function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status) {
    const colors = {
        'Available': 'bg-green-100 text-green-800',
        'Occupied': 'bg-red-100 text-red-800',
        'Maintenance': 'bg-yellow-100 text-yellow-800',
        'Cleaning': 'bg-blue-100 text-blue-800',
        'Active': 'bg-green-100 text-green-800',
        'Completed': 'bg-blue-100 text-blue-800',
        'Cancelled': 'bg-red-100 text-red-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Paid': 'bg-green-100 text-green-800',
        'Income': 'bg-green-100 text-green-800',
        'Expense': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}
