import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Phone, CreditCard, User, Bed, Clock } from 'lucide-react';
import { bookingsAPI } from '../services/api';

const BookingCalendar = ({ onDateClick, onBookingClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredBooking, setHoveredBooking] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, [currentDate]);

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

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getBookingsForDate = (date) => {
        if (!date) return [];

        const dateStr = date.toISOString().split('T')[0];
        return bookings.filter(booking => {
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            const currentDate = new Date(dateStr);

            return currentDate >= checkIn && currentDate < checkOut;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-500';
            case 'Completed': return 'bg-blue-500';
            case 'Cancelled': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            if (direction === 'prev') {
                newDate.setMonth(newDate.getMonth() - 1);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    };

    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Booking Calendar
                </h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white min-w-[200px] text-center">
                        {formatDate(currentDate)}
                    </h4>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Loading calendar...</p>
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {/* Week day headers */}
                    {weekDays.map((day, index) => (
                        <div key={index} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {days.map((day, index) => {
                        const dayBookings = getBookingsForDate(day);
                        const isToday = day && day.toDateString() === new Date().toDateString();

                        return (
                            <div
                                key={index}
                                className={`min-h-[80px] p-2 border border-gray-200 dark:border-gray-700 ${day ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'
                                    } ${isToday ? 'ring-2 ring-blue-500' : ''} cursor-pointer transition-colors`}
                                onClick={() => day && onDateClick && onDateClick(day)}
                            >
                                {day && (
                                    <>
                                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {day.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {dayBookings.slice(0, 2).map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className={`text-xs p-1 rounded text-white truncate cursor-pointer ${getStatusColor(booking.booking_status)} hover:opacity-80 transition-opacity`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onBookingClick && onBookingClick(booking);
                                                    }}
                                                    onMouseEnter={() => setHoveredBooking(booking)}
                                                    onMouseLeave={() => setHoveredBooking(null)}
                                                    title={`${booking.guest_name} - Room ${booking.rooms?.room_number} - ${booking.phone_number || 'No phone'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="truncate">{booking.guest_name}</span>
                                                        <span className="text-xs opacity-75">{booking.rooms?.room_number}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {dayBookings.length > 2 && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                    +{dayBookings.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Booking Details Tooltip */}
            {hoveredBooking && (
                <div className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 max-w-sm">
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900 dark:text-white">{hoveredBooking.guest_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{hoveredBooking.phone_number || 'No phone'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Aadhar: {hoveredBooking.aadhar_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Bed className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Room {hoveredBooking.rooms?.room_number} ({hoveredBooking.rooms?.room_type})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(hoveredBooking.check_in).toLocaleDateString('en-US')} - {new Date(hoveredBooking.check_out).toLocaleDateString('en-US')}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hoveredBooking.booking_status)}`}>
                                {hoveredBooking.booking_status}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingCalendar;
