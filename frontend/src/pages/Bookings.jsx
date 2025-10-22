import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Eye, Clock, User, Bed, DollarSign, Calendar as CalendarIcon, Grid, List, Phone } from 'lucide-react';
import { bookingsAPI, roomsAPI } from '../services/api';
import BookingCalendar from '../components/BookingCalendar';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showNewBookingModal, setShowNewBookingModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [newBooking, setNewBooking] = useState({
        guest_name: '',
        phone_number: '',
        aadhar_number: '',
        room_id: '',
        check_in: '',
        check_out: '',
        payment_status: 'Pending'
    });

    useEffect(() => {
        fetchBookings();
        fetchRooms();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingsAPI.getAll();
            if (response.success) {
                setBookings(response.data);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await roomsAPI.getAll();
            if (response.success) {
                setRooms(response.data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();

        // Date validation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(newBooking.check_in);
        const checkOutDate = new Date(newBooking.check_out);

        if (checkInDate < today) {
            alert('Check-in date cannot be earlier than today');
            return;
        }

        if (checkOutDate <= checkInDate) {
            alert('Check-out date must be after check-in date');
            return;
        }

        // Frontend strict validation for phone and Aadhaar
        if (!/^\d{10}$/.test(newBooking.phone_number)) {
            alert('Phone number must be exactly 10 digits');
            return;
        }
        if (!/^\d{12}$/.test(newBooking.aadhar_number)) {
            alert('Aadhaar number must be exactly 12 digits');
            return;
        }

        try {
            const response = await bookingsAPI.create(newBooking);
            if (response.success) {
                setShowNewBookingModal(false);
                setNewBooking({
                    guest_name: '',
                    phone_number: '',
                    aadhar_number: '',
                    room_id: '',
                    check_in: '',
                    check_out: '',
                    payment_status: 'Pending'
                });
                fetchBookings();
                // Refresh rooms so the booked room disappears if it became occupied
                fetchRooms();
            }
        } catch (error) {
            // Show pop-up error from backend (e.g., overlap or validation)
            alert(error?.response?.data?.error || 'Error creating booking');
            console.error('Error creating booking:', error);
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                const response = await bookingsAPI.cancel(id);
                if (response.success) {
                    fetchBookings();
                }
            } catch (error) {
                console.error('Error cancelling booking:', error);
            }
        }
    };

    const handleCheckout = async (id) => {
        if (window.confirm('Are you sure you want to checkout this booking?')) {
            try {
                const response = await bookingsAPI.checkout(id);
                if (response.success) {
                    fetchBookings();
                }
            } catch (error) {
                console.error('Error checking out booking:', error);
            }
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const roomNumber = booking.rooms?.room_number?.toString?.() || '';
        const phone = booking.phone_number || '';
        const term = searchTerm.toLowerCase();
        const matchesSearch = booking.guest_name.toLowerCase().includes(term) ||
            roomNumber.toLowerCase().includes(term) ||
            phone.toLowerCase().includes(term);
        const matchesStatus = !statusFilter || booking.booking_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const calculateNights = (checkIn, checkOut) => {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const diffTime = Math.abs(checkOutDate - checkInDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleCalendarDateClick = (date) => {
        setNewBooking(prev => ({
            ...prev,
            check_in: date.toISOString().split('T')[0]
        }));
        setShowNewBookingModal(true);
    };

    const handleCalendarBookingClick = (booking) => {
        setSelectedBooking(booking);
        setShowEditModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Booking Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage guest bookings, check-ins, and check-outs
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${viewMode === 'list'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <List className="h-4 w-4 mr-1" />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center px-3 py-1 rounded-md transition-colors ${viewMode === 'calendar'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <Grid className="h-4 w-4 mr-1" />
                            Calendar
                        </button>
                    </div>
                    <button
                        onClick={() => setShowNewBookingModal(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Booking
                    </button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <BookingCalendar
                    onDateClick={handleCalendarDateClick}
                    onBookingClick={handleCalendarBookingClick}
                />
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search bookings..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="sm:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookings...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No bookings found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchTerm || statusFilter ? 'Try adjusting your search criteria.' : 'Create your first booking to get started.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Guest</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Phone</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Room</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Check-in</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Check-out</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Nights</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Payment</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-900 dark:text-white">{booking.guest_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-900 dark:text-white">{booking.phone_number || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <Bed className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-900 dark:text-white">
                                                        {booking.rooms?.room_number} ({booking.rooms?.room_type})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-900 dark:text-white">{formatDate(booking.check_in)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-900 dark:text-white">{formatDate(booking.check_out)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-900 dark:text-white">
                                                        {calculateNights(booking.check_in, booking.check_out)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-gray-900 dark:text-white">₹{booking.total_amount}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                                                    {booking.booking_status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                                                    {booking.payment_status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {booking.booking_status === 'Active' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleCheckout(booking.id)}
                                                                className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                                                title="Checkout"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelBooking(booking.id)}
                                                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                                title="Cancel"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* New Booking Modal */}
            {showNewBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">New Booking</h2>
                        <form onSubmit={handleCreateBooking}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Guest Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newBooking.guest_name}
                                        onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="9876543210"
                                        pattern="[0-9]{10}"
                                        maxLength="10"
                                        value={newBooking.phone_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setNewBooking({ ...newBooking, phone_number: value });
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Aadhar Number
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="123456789012"
                                        pattern="[0-9]{12}"
                                        maxLength="12"
                                        value={newBooking.aadhar_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, ''); // Only numbers
                                            if (value.length <= 12) {
                                                setNewBooking({ ...newBooking, aadhar_number: value });
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Room
                                    </label>
                                    <select
                                        required
                                        value={newBooking.room_id}
                                        onChange={(e) => setNewBooking({ ...newBooking, room_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Select Room</option>
                                        {rooms.filter(room => room.status === 'Available').map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.room_number} - {room.room_type} (₹{room.rate_per_night}/night)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Check-in Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={newBooking.check_in}
                                        onChange={(e) => {
                                            setNewBooking({ ...newBooking, check_in: e.target.value });
                                            // Reset check-out date if it's before or equal to check-in
                                            if (newBooking.check_out && e.target.value >= newBooking.check_out) {
                                                setNewBooking(prev => ({ ...prev, check_out: '' }));
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Check-out Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={newBooking.check_in ? new Date(new Date(newBooking.check_in).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                        value={newBooking.check_out}
                                        onChange={(e) => setNewBooking({ ...newBooking, check_out: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Status
                                    </label>
                                    <select
                                        value={newBooking.payment_status}
                                        onChange={(e) => setNewBooking({ ...newBooking, payment_status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowNewBookingModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Booking
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Details Modal */}
            {showEditModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking Details</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Name</label>
                                    <p className="text-gray-900 dark:text-white">{selectedBooking.guest_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                    <p className="text-gray-900 dark:text-white">{selectedBooking.phone_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aadhar Number</label>
                                    <p className="text-gray-900 dark:text-white">{selectedBooking.aadhar_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room</label>
                                    <p className="text-gray-900 dark:text-white">
                                        {selectedBooking.rooms?.room_number} ({selectedBooking.rooms?.room_type})
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-in</label>
                                    <p className="text-gray-900 dark:text-white">{formatDate(selectedBooking.check_in)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Check-out</label>
                                    <p className="text-gray-900 dark:text-white">{formatDate(selectedBooking.check_out)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nights</label>
                                    <p className="text-gray-900 dark:text-white">
                                        {calculateNights(selectedBooking.check_in, selectedBooking.check_out)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                                    <p className="text-gray-900 dark:text-white">₹{selectedBooking.total_amount}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Booking Status</label>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.booking_status)}`}>
                                        {selectedBooking.booking_status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedBooking.payment_status)}`}>
                                        {selectedBooking.payment_status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bookings;
