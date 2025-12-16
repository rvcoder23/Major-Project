import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Bed,
    Users,
    IndianRupee,
    Calendar,
    TrendingUp,
    TrendingDown,
    Eye,
    Clock,
    CheckCircle,
    AlertCircle,
    BarChart3
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { reportsAPI, bookingsAPI } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const { data: dashboardData, isLoading: loading, isError, error, dataUpdatedAt } = useQuery({
        queryKey: ['dashboard-live'],
        queryFn: async () => {
            const [kpisRes, occupancyRes, revenueRes, checkinsRes, checkoutsRes, liveRes] = await Promise.all([
                reportsAPI.getDashboard(),
                reportsAPI.getOccupancy('7'),
                reportsAPI.getRevenue(),
                bookingsAPI.getTodayCheckins(),
                bookingsAPI.getTodayCheckouts(),
                reportsAPI.getDashboardLive()
            ]);

            return {
                kpis: kpisRes.data,
                occupancy: occupancyRes.data || [],
                revenue: revenueRes.data || [],
                checkins: checkinsRes.data || [],
                checkouts: checkoutsRes.data || [],
                live: liveRes.data || {}
            };
        },
        refetchInterval: 30000,
        staleTime: 15000
    });

    const kpis = dashboardData?.kpis;
    const live = dashboardData?.live || {};
    const occupancyData = dashboardData?.occupancy || [];
    const revenueData = dashboardData?.revenue || [];
    const todayCheckins = dashboardData?.checkins || [];
    const todayCheckouts = dashboardData?.checkouts || [];

    const kpiCards = [
        {
            title: 'Total Rooms',
            value: kpis?.totalRooms || 0,
            icon: Bed,
            color: 'bg-blue-500'
        },
        {
            title: 'Available Rooms',
            value: kpis?.availableRooms || 0,
            icon: Eye,
            color: 'bg-green-500'
        },
        {
            title: 'Occupied Rooms',
            value: kpis?.occupiedRooms || 0,
            icon: Users,
            color: 'bg-orange-500'
        },
        {
            title: "Today's Revenue",
            value: formatCurrency(kpis?.todayRevenue || 0),
            icon: IndianRupee,
            color: 'bg-purple-500'
        },
        {
            title: 'Pending Cleaning',
            value: live.pendingCleaning ?? kpis?.pendingCleaning ?? 0,
            icon: Clock,
            color: 'bg-red-500'
        },
        {
            title: "Today's Check-ins",
            value: live.todayCheckins ?? kpis?.todayCheckins ?? 0,
            icon: Calendar,
            color: 'bg-indigo-500'
        }
    ];

    const roomStatusData = [
        { name: 'Available', value: kpis?.availableRooms || 0, color: '#10B981' },
        { name: 'Occupied', value: kpis?.occupiedRooms || 0, color: '#F59E0B' },
        { name: 'Maintenance', value: kpis?.maintenanceRooms || 0, color: '#EF4444' },
        { name: 'Cleaning', value: kpis?.cleaningRooms || 0, color: '#3B82F6' }
    ];

    const roomStatusChartData = roomStatusData.filter((item) => item.value > 0);
    const hasRoomStatusData = roomStatusChartData.length > 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center h-64 text-red-600">
                <p>Error loading dashboard: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Welcome back! Here's what's happening at your hotel today.
                    </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Live refresh every 30s • Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '–'}
                </div>
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 gap-3">
                {(live.alerts?.length || 0) === 0 ? (
                    <div className="flex items-center text-sm text-green-700 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        All clear. No active alerts.
                    </div>
                ) : (
                    live.alerts.map((alert, idx) => (
                        <div key={idx} className="flex items-center text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {alert}
                        </div>
                    ))
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {card.title}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {card.value}
                                </p>
                            </div>
                            <div className={`${card.color} p-3 rounded-lg`}>
                                <card.icon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Occupancy Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Weekly Occupancy
                    </h3>
                    {occupancyData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 dark:text-gray-400">
                            <Calendar className="h-10 w-10 mb-3 text-gray-400" />
                            <p className="font-medium">No bookings found for the last 7 days</p>
                            <p className="text-xs mt-1">Create bookings to see occupancy trends here.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={occupancyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="bookings" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Room Status Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Room Status Distribution
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Live status based on current room records
                    </p>
                    <div className="flex flex-col md:flex-row md:items-center">
                        <div className="flex-1">
                            {hasRoomStatusData ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={roomStatusChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {roomStatusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-56 text-center text-gray-500 dark:text-gray-400">
                                    <Bed className="h-10 w-10 mb-3 text-gray-400" />
                                    <p className="font-medium">No room status data available</p>
                                    <p className="text-xs mt-1">Add rooms to see distribution by status.</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-6 space-y-2 text-sm">
                            {roomStatusData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span
                                            className="inline-block h-3 w-3 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Monthly Revenue Trend
                </h3>
                {revenueData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 dark:text-gray-400">
                        <IndianRupee className="h-10 w-10 mb-3 text-gray-400" />
                        <p className="font-medium">No revenue data for this month</p>
                        <p className="text-xs mt-1">Record income entries to see the trend.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Today's Check-ins and Check-outs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Check-ins */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        Today's Check-ins ({todayCheckins.length})
                    </h3>
                    {todayCheckins.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">No check-ins scheduled for today</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayCheckins.slice(0, 5).map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{booking.guest_name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Room {booking.rooms?.room_number} • {booking.rooms?.room_type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                            ₹{booking.total_amount}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(booking.check_in).toLocaleDateString('en-US')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {todayCheckins.length > 5 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    and {todayCheckins.length - 5} more check-ins...
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Today's Check-outs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        Today's Check-outs ({todayCheckouts.length})
                    </h3>
                    {todayCheckouts.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">No check-outs scheduled for today</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todayCheckouts.slice(0, 5).map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{booking.guest_name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Room {booking.rooms?.room_number} • {booking.rooms?.room_type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                            ₹{booking.total_amount}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(booking.check_out).toLocaleDateString('en-US')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {todayCheckouts.length > 5 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    and {todayCheckouts.length - 5} more check-outs...
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
