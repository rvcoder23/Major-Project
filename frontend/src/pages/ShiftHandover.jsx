import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Users, Home, UtensilsCrossed, DollarSign, AlertTriangle, Star, FileText, CheckCircle, Printer, RefreshCw } from 'lucide-react';
import { handoversAPI, staffAPI } from '../services/api';

const ShiftHandover = () => {
    const queryClient = useQueryClient();
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [handoverNotes, setHandoverNotes] = useState({
        pending_issues: '',
        special_notes: ''
    });
    const [selectedStaffId, setSelectedStaffId] = useState('');

    // Get current shift info
    const { data: currentShiftData } = useQuery({
        queryKey: ['currentShift'],
        queryFn: () => staffAPI.getCurrentShift(),
        refetchInterval: 60000 // Refresh every minute
    });

    // Get current handover (pending for incoming shift)
    const { data: currentHandover, isLoading: loadingHandover } = useQuery({
        queryKey: ['currentHandover'],
        queryFn: () => handoversAPI.getCurrent(),
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    // Get staff list
    const { data: staffData } = useQuery({
        queryKey: ['staff'],
        queryFn: () => staffAPI.getAll({ active: true })
    });

    const staff = staffData?.data || [];
    const currentShift = currentShiftData?.shift_code || 'M';
    const pendingHandover = currentHandover?.data;

    // Generate handover mutation
    const generateHandoverMutation = useMutation({
        mutationFn: (data) => handoversAPI.generate(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['currentHandover']);
            setShowGenerateModal(false);
            setHandoverNotes({ pending_issues: '', special_notes: '' });
            setSelectedStaffId('');
            alert('Handover report generated successfully!');
        },
        onError: (error) => {
            alert(error?.response?.data?.error || 'Failed to generate handover');
        }
    });

    // Acknowledge handover mutation
    const acknowledgeHandoverMutation = useMutation({
        mutationFn: ({ id, staff_id }) => handoversAPI.acknowledge(id, { incoming_staff_id: staff_id }),
        onSuccess: () => {
            queryClient.invalidateQueries(['currentHandover']);
            alert('Handover acknowledged successfully!');
        },
        onError: (error) => {
            alert(error?.response?.data?.error || 'Failed to acknowledge handover');
        }
    });

    const handleGenerateHandover = () => {
        if (!selectedStaffId) {
            alert('Please select your name');
            return;
        }

        const data = {
            outgoing_staff_id: parseInt(selectedStaffId),
            ...handoverNotes
        };

        generateHandoverMutation.mutate(data);
    };

    const handleAcknowledgeHandover = () => {
        if (!selectedStaffId) {
            alert('Please select your name');
            return;
        }

        acknowledgeHandoverMutation.mutate({
            id: pendingHandover.id,
            staff_id: parseInt(selectedStaffId)
        });
    };

    const getShiftName = (code) => {
        const names = { 'M': 'Morning', 'A': 'Afternoon', 'E': 'Evening' };
        return names[code] || code;
    };

    const getShiftTime = (code) => {
        const times = {
            'M': '6:00 AM - 2:00 PM',
            'A': '2:00 PM - 10:00 PM',
            'E': '10:00 PM - 6:00 AM'
        };
        return times[code] || '';
    };

    const printHandover = () => {
        window.print();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Shift Handover
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Current Shift: <strong>{getShiftName(currentShift)}</strong></span>
                    </div>
                    <div>
                        <span>{getShiftTime(currentShift)}</span>
                    </div>
                </div>
            </div>

            {/* Pending Handover Alert */}
            {pendingHandover && pendingHandover.status === 'Pending' && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
                            <div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                    Handover Report Available
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    {pendingHandover.outgoing_shift_info?.shift_name} shift has prepared a handover report. Please review and acknowledge.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mb-6 flex space-x-4">
                <button
                    onClick={() => setShowGenerateModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <FileText className="h-5 w-5 mr-2" />
                    Generate Handover Report
                </button>
                {pendingHandover && (
                    <button
                        onClick={printHandover}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Printer className="h-5 w-5 mr-2" />
                        Print Report
                    </button>
                )}
            </div>

            {/* Handover Report Display */}
            {pendingHandover ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 print:shadow-none">
                    {/* Report Header */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            SHIFT HANDOVER REPORT
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">From:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {pendingHandover.outgoing_shift_info?.shift_name} Shift
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">To:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {pendingHandover.incoming_shift_info?.shift_name} Shift
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Date:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {new Date(pendingHandover.handover_date).toLocaleDateString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Time:</span>
                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                                    {new Date(pendingHandover.handover_time).toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Bookings Summary */}
                        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {pendingHandover.total_reservations + pendingHandover.total_checkins}
                                </span>
                            </div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Bookings</h3>
                            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <div>Reservations: {pendingHandover.total_reservations}</div>
                                <div>Check-ins: {pendingHandover.total_checkins}</div>
                                <div>Check-outs: {pendingHandover.total_checkouts}</div>
                            </div>
                        </div>

                        {/* Rooms Summary */}
                        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Home className="h-6 w-6 text-green-600 dark:text-green-400" />
                                <span className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    {pendingHandover.occupied_rooms}
                                </span>
                            </div>
                            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Occupied</h3>
                            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                                <div>Reserved: {pendingHandover.reserved_rooms}</div>
                                <div>Available: {pendingHandover.available_rooms}</div>
                                <div>Cleaning: {pendingHandover.cleaning_rooms}</div>
                            </div>
                        </div>

                        {/* Food Orders Summary */}
                        <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <UtensilsCrossed className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                    {pendingHandover.pending_food_orders}
                                </span>
                            </div>
                            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Pending Orders</h3>
                            <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                                <div>Completed: {pendingHandover.completed_food_orders}</div>
                            </div>
                        </div>

                        {/* Revenue Summary */}
                        <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    ₹{pendingHandover.total_revenue?.toLocaleString()}
                                </span>
                            </div>
                            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Revenue</h3>
                            <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                                <div>Pending: {pendingHandover.pending_payments}</div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Sections */}
                    <div className="space-y-6">
                        {/* Pending Issues */}
                        {pendingHandover.pending_issues && (
                            <div>
                                <div className="flex items-center mb-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Pending Issues
                                    </h3>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
                                    <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap">
                                        {pendingHandover.pending_issues}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* VIP Guests */}
                        {pendingHandover.vip_guests && (
                            <div>
                                <div className="flex items-center mb-3">
                                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        VIP Guests
                                    </h3>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                                    <p className="text-sm text-yellow-900 dark:text-yellow-100 whitespace-pre-wrap">
                                        {pendingHandover.vip_guests}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Special Notes */}
                        {pendingHandover.special_notes && (
                            <div>
                                <div className="flex items-center mb-3">
                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Special Notes
                                    </h3>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                                        {pendingHandover.special_notes}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Prepared By */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Prepared by: <strong>{pendingHandover.outgoing_staff?.name}</strong> ({pendingHandover.outgoing_staff?.employee_id})
                            </p>
                        </div>

                        {/* Acknowledge Button */}
                        {pendingHandover.status === 'Pending' && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex items-center space-x-4">
                                    <select
                                        value={selectedStaffId}
                                        onChange={(e) => setSelectedStaffId(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Select Your Name</option>
                                        {staff.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.employee_id})</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleAcknowledgeHandover}
                                        disabled={!selectedStaffId}
                                        className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Acknowledge Handover
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Acknowledged Status */}
                        {pendingHandover.status === 'Acknowledged' && (
                            <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                                <p className="text-sm text-green-900 dark:text-green-100">
                                    ✓ Acknowledged by <strong>{pendingHandover.acknowledged_staff?.name}</strong> at{' '}
                                    {new Date(pendingHandover.acknowledged_time).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <RefreshCw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Handover Report Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Generate a handover report to pass information to the next shift.
                    </p>
                </div>
            )}

            {/* Generate Handover Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Generate Handover Report
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Your Name *
                                </label>
                                <select
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">Select Your Name</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.employee_id})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Pending Issues
                                </label>
                                <textarea
                                    value={handoverNotes.pending_issues}
                                    onChange={(e) => setHandoverNotes({ ...handoverNotes, pending_issues: e.target.value })}
                                    rows="4"
                                    placeholder="List any pending issues, maintenance requests, or problems that need attention..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Special Notes
                                </label>
                                <textarea
                                    value={handoverNotes.special_notes}
                                    onChange={(e) => setHandoverNotes({ ...handoverNotes, special_notes: e.target.value })}
                                    rows="4"
                                    placeholder="Add any special notes, upcoming events, or important information..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    <strong>Note:</strong> All booking, room, food order, and revenue statistics will be automatically collected.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateHandover}
                                disabled={!selectedStaffId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftHandover;
