import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Eye, Clock, User, Bed, IndianRupee, Calendar as CalendarIcon, Grid, List, Phone } from 'lucide-react';
import { bookingsAPI, roomsAPI, billsAPI } from '../services/api';
import BookingCalendar from '../components/BookingCalendar';
import Invoice from '../components/Invoice';

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer']);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showNewBookingModal, setShowNewBookingModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [currentBill, setCurrentBill] = useState(null);
    const [generatingBill, setGeneratingBill] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [newBooking, setNewBooking] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        aadhar_number: '',
        room_id: '',
        check_in: '',
        check_out: '',
        payment_status: 'Pending',
        payment_method: 'Cash',
        registration_card_printout: false,
        vip_category: '',
        booking_notes: ''
    });
    const [bookingCalculation, setBookingCalculation] = useState({
        baseAmount: 0,
        gstRate: 0,
        gstAmount: 0,
        totalAmount: 0,
        nights: 0
    });

    useEffect(() => {
        fetchBookings();
        fetchRooms();
        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        calculateBookingAmount();
    }, [newBooking.room_id, newBooking.check_in, newBooking.check_out]);

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

    const fetchPaymentMethods = async () => {
        try {
            const response = await bookingsAPI.getPaymentMethods();
            if (response.success && Array.isArray(response.data)) {
                setPaymentMethods(response.data);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };

    const calculateGstRate = (baseAmount) => {
        const amount = Number(baseAmount) || 0;
        if (amount >= 0 && amount <= 5499) return 12;      // 12%
        if (amount >= 5500 && amount <= 7499) return 18;   // 18%
        if (amount >= 7500) return 28;                     // 28%
        return 12;
    };

    const calculateBookingAmount = () => {
        if (!newBooking.room_id || !newBooking.check_in || !newBooking.check_out) {
            setBookingCalculation({
                baseAmount: 0,
                gstRate: 0,
                gstAmount: 0,
                totalAmount: 0,
                nights: 0
            });
            return;
        }

        const selectedRoom = rooms.find(r => r.id === parseInt(newBooking.room_id));
        if (!selectedRoom) return;

        const checkIn = new Date(newBooking.check_in);
        const checkOut = new Date(newBooking.check_out);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        if (nights <= 0) return;

        const baseAmount = nights * selectedRoom.rate_per_night;
        const gstRate = calculateGstRate(baseAmount);
        const gstAmount = Math.round(baseAmount * (gstRate / 100) * 100) / 100;
        const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;

        setBookingCalculation({
            baseAmount,
            gstRate,
            gstAmount,
            totalAmount,
            nights
        });
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
            // Map UI state to API payload
            const payload = {
                ...newBooking,
                registration_card_printout: Boolean(newBooking.registration_card_printout) || false,
                vip_category: newBooking.vip_category || undefined,
                booking_notes: newBooking.booking_notes || undefined
            };

            const response = await bookingsAPI.create(payload);
            if (response.success) {
                setShowNewBookingModal(false);
                setNewBooking({
                    first_name: '',
                    last_name: '',
                    phone_number: '',
                    aadhar_number: '',
                    room_id: '',
                    check_in: '',
                    check_out: '',
                    payment_status: 'Pending',
                    payment_method: 'Cash',
                    registration_card_printout: false,
                    vip_category: '',
                    booking_notes: ''
                });
                setBookingCalculation({
                    baseAmount: 0,
                    gstRate: 0,
                    gstAmount: 0,
                    totalAmount: 0,
                    nights: 0
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

    const handleGenerateBill = async () => {
        if (!selectedBooking) return;
        
        try {
            setGeneratingBill(true);
            const response = await billsAPI.generateForBooking(selectedBooking.id, {
                payment_method: selectedBooking.payment_method || 'Cash',
                payment_status: selectedBooking.payment_status || 'Pending'
            });
            
            if (response.success) {
                setCurrentBill(response.data);
                setShowEditModal(false);
                setShowInvoice(true);
            } else {
                alert('Failed to generate bill');
            }
        } catch (error) {
            console.error('Error generating bill:', error);
            alert(error?.response?.data?.error || 'Failed to generate bill');
        } finally {
            setGeneratingBill(false);
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
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Payment Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Payment Method</th>
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
                                                    <IndianRupee className="h-4 w-4 text-gray-400 mr-2" />
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
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {booking.payment_method || 'Cash'}
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Booking</h2>
                            <button
                                onClick={() => setShowNewBookingModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateBooking}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newBooking.first_name}
                                            onChange={(e) => setNewBooking({ ...newBooking, first_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newBooking.last_name}
                                            onChange={(e) => setNewBooking({ ...newBooking, last_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Payment Method *
                                    </label>
                                    <select
                                        required
                                        value={newBooking.payment_method}
                                        onChange={(e) => setNewBooking({ ...newBooking, payment_method: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        {paymentMethods.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Amount Breakdown */}
                                {bookingCalculation.nights > 0 && (
                                    <div className="col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Amount Breakdown</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Room Rate ({bookingCalculation.nights} night{bookingCalculation.nights > 1 ? 's' : ''}):</span>
                                                <span className="text-gray-900 dark:text-white font-medium">₹{bookingCalculation.baseAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">GST ({bookingCalculation.gstRate}%):</span>
                                                <span className="text-gray-900 dark:text-white font-medium">₹{bookingCalculation.gstAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-900 dark:text-white font-semibold">Total Amount:</span>
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">₹{bookingCalculation.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="registrationCardPrintout"
                                        type="checkbox"
                                        checked={newBooking.registration_card_printout}
                                        onChange={(e) =>
                                            setNewBooking({
                                                ...newBooking,
                                                registration_card_printout: e.target.checked
                                            })
                                        }
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor="registrationCardPrintout"
                                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        Registration card printout required
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        VIP Category
                                    </label>
                                    <select
                                        value={newBooking.vip_category}
                                        onChange={(e) => setNewBooking({ ...newBooking, vip_category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">None</option>
                                        <option value="VIP">VIP</option>
                                        <option value="CIP">CIP</option>
                                        <option value="VVIP">VVIP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Booking Notes / Special Requests
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={newBooking.booking_notes}
                                        onChange={(e) => setNewBooking({ ...newBooking, booking_notes: e.target.value })}
                                        placeholder="e.g., May arrive late, room preferences, special requests"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 pt-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowNewBookingModal(false)}
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GST</label>
                                    <p className="text-gray-900 dark:text-white">
                                        {selectedBooking.gst_rate
                                            ? `${selectedBooking.gst_rate}% (₹${selectedBooking.gst_amount || 0})`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Base Amount</label>
                                    <p className="text-gray-900 dark:text-white">₹{selectedBooking.base_amount || (selectedBooking.total_amount - (selectedBooking.gst_amount || 0)).toFixed(2)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GST ({selectedBooking.gst_rate || 0}%)</label>
                                    <p className="text-gray-900 dark:text-white">₹{selectedBooking.gst_amount || 0}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount (Incl. GST)</label>
                                    <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">₹{selectedBooking.total_amount}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                                    <p className="text-gray-900 dark:text-white">{selectedBooking.payment_method || 'Cash'}</p>
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">VIP Category</label>
                                    <p className="text-gray-900 dark:text-white">{selectedBooking.vip_category || 'None'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Card Printout</label>
                                    <p className="text-gray-900 dark:text-white">
                                        {selectedBooking.registration_card_printout ? 'Yes' : 'No'}
                                    </p>
                                </div>
                                {selectedBooking.booking_notes && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Booking Notes</label>
                                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                            {selectedBooking.booking_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={handleGenerateBill}
                                disabled={generatingBill}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {generatingBill ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Generate Bill
                                    </>
                                )}
                            </button>
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

            {/* Invoice Modal */}
            {showInvoice && currentBill && (
                <Invoice bill={currentBill} onClose={() => setShowInvoice(false)} />
            )}
        </div>
    );
};

export default Bookings;
