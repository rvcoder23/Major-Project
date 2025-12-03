import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Filter, Calendar, FileText, PieChart, TrendingUp, TrendingDown, Users, IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { reportsAPI, accountsAPI, bookingsAPI, roomsAPI } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [activeReport, setActiveReport] = useState('dashboard');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [dashboardData, setDashboardData] = useState({});
    const [occupancyData, setOccupancyData] = useState([]);
    const [occupancyPeriod, setOccupancyPeriod] = useState('7'); // 7 days (weekly) or 30 days (monthly)
    const [revenueData, setRevenueData] = useState([]);
    const [comprehensiveData, setComprehensiveData] = useState({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, occupancyRes, revenueRes] = await Promise.all([
                reportsAPI.getDashboard(),
                reportsAPI.getOccupancy(occupancyPeriod),
                reportsAPI.getRevenue()
            ]);
            
            if (dashboardRes.success) setDashboardData(dashboardRes.data);
            if (occupancyRes.success) setOccupancyData(occupancyRes.data);
            if (revenueRes.success) setRevenueData(revenueRes.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchComprehensiveReport = async () => {
        try {
            setLoading(true);
            const res = await reportsAPI.getComprehensive(dateRange.startDate, dateRange.endDate);
            if (res.success) setComprehensiveData(res.data);
        } catch (err) {
            console.error('Error fetching comprehensive report:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('Front Office Management - Report', 20, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`, 20, 35);
        
        // Dashboard KPIs
        doc.setFontSize(16);
        doc.text('Dashboard KPIs', 20, 50);
        
        const kpiData = [
            ['Metric', 'Value'],
            ['Total Rooms', dashboardData.totalRooms || 0],
            ['Available Rooms', dashboardData.availableRooms || 0],
            ['Occupied Rooms', dashboardData.occupiedRooms || 0],
            ['Today Revenue', `₹${dashboardData.todayRevenue || 0}`],
            ['Pending Cleaning', dashboardData.pendingCleaning || 0],
            ['Today Check-ins', dashboardData.todayCheckins || 0]
        ];
        
        doc.autoTable({
            head: [kpiData[0]],
            body: kpiData.slice(1),
            startY: 60,
            styles: { fontSize: 10 }
        });
        
        // Comprehensive Report Data
        if (Object.keys(comprehensiveData).length > 0) {
            doc.setFontSize(16);
            doc.text('Comprehensive Report', 20, doc.lastAutoTable.finalY + 20);
            
            const reportData = [
                ['Category', 'Metric', 'Value'],
                ['Bookings', 'Total', comprehensiveData.bookings?.total || 0],
                ['Bookings', 'Revenue', `₹${comprehensiveData.bookings?.totalRevenue || 0}`],
                ['Bookings', 'Completed', comprehensiveData.bookings?.completed || 0],
                ['Bookings', 'Cancelled', comprehensiveData.bookings?.cancelled || 0],
                ['Accounts', 'Total Income', `₹${comprehensiveData.accounts?.totalIncome || 0}`],
                ['Accounts', 'Total Expense', `₹${comprehensiveData.accounts?.totalExpense || 0}`],
                ['Accounts', 'Net Profit', `₹${comprehensiveData.accounts?.netProfit || 0}`],
                ['Housekeeping', 'Total Tasks', comprehensiveData.housekeeping?.totalTasks || 0],
                ['Housekeeping', 'Completed', comprehensiveData.housekeeping?.completed || 0],
                ['Housekeeping', 'Pending', comprehensiveData.housekeeping?.pending || 0]
            ];
            
            doc.autoTable({
                head: [reportData[0]],
                body: reportData.slice(1),
                startY: doc.lastAutoTable.finalY + 30,
                styles: { fontSize: 10 }
            });
        }
        
        doc.save(`hotel-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToExcel = () => {
        // Create CSV content
        let csvContent = "Front Office Management Report\n";
        csvContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
        csvContent += `Date Range: ${dateRange.startDate} to ${dateRange.endDate}\n\n`;
        
        csvContent += "Dashboard KPIs\n";
        csvContent += "Metric,Value\n";
        csvContent += `Total Rooms,${dashboardData.totalRooms || 0}\n`;
        csvContent += `Available Rooms,${dashboardData.availableRooms || 0}\n`;
        csvContent += `Occupied Rooms,${dashboardData.occupiedRooms || 0}\n`;
        csvContent += `Today Revenue,₹${dashboardData.todayRevenue || 0}\n`;
        csvContent += `Pending Cleaning,${dashboardData.pendingCleaning || 0}\n`;
        csvContent += `Today Check-ins,${dashboardData.todayCheckins || 0}\n\n`;
        
        if (Object.keys(comprehensiveData).length > 0) {
            csvContent += "Comprehensive Report\n";
            csvContent += "Category,Metric,Value\n";
            csvContent += `Bookings,Total,${comprehensiveData.bookings?.total || 0}\n`;
            csvContent += `Bookings,Revenue,₹${comprehensiveData.bookings?.totalRevenue || 0}\n`;
            csvContent += `Bookings,Completed,${comprehensiveData.bookings?.completed || 0}\n`;
            csvContent += `Bookings,Cancelled,${comprehensiveData.bookings?.cancelled || 0}\n`;
            csvContent += `Accounts,Total Income,₹${comprehensiveData.accounts?.totalIncome || 0}\n`;
            csvContent += `Accounts,Total Expense,₹${comprehensiveData.accounts?.totalExpense || 0}\n`;
            csvContent += `Accounts,Net Profit,₹${comprehensiveData.accounts?.netProfit || 0}\n`;
            csvContent += `Housekeeping,Total Tasks,${comprehensiveData.housekeeping?.totalTasks || 0}\n`;
            csvContent += `Housekeeping,Completed,${comprehensiveData.housekeeping?.completed || 0}\n`;
            csvContent += `Housekeeping,Pending,${comprehensiveData.housekeeping?.pending || 0}\n`;
        }
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotel-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const reportTypes = [
        { id: 'dashboard', name: 'Dashboard', icon: BarChart3, color: 'blue' },
        { id: 'occupancy', name: 'Occupancy', icon: Users, color: 'green' },
        { id: 'revenue', name: 'Revenue', icon: IndianRupee, color: 'purple' },
        { id: 'comprehensive', name: 'Comprehensive', icon: FileText, color: 'orange' }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Generate comprehensive reports and view analytics
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button 
                        onClick={exportToPDF}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Export PDF
                    </button>
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Report Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportTypes.map((report) => {
                    const IconComponent = report.icon;
                    return (
                        <button
                            key={report.id}
                            onClick={() => setActiveReport(report.id)}
                            className={`p-6 rounded-lg border-2 transition-all ${
                                activeReport === report.id
                                    ? `border-${report.color}-500 bg-${report.color}-50 dark:bg-${report.color}-900/20`
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center">
                                <IconComponent className={`h-8 w-8 text-${report.color}-500 mr-3`} />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{report.name}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">Available</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Date Range Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={fetchComprehensiveReport}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Dashboard Report */}
            {activeReport === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center">
                                <Users className="h-8 w-8 text-blue-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rooms</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.totalRooms || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Rooms</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.availableRooms || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center">
                                <Users className="h-8 w-8 text-orange-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupied Rooms</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.occupiedRooms || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center">
                                <IndianRupee className="h-8 w-8 text-green-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{dashboardData.todayRevenue || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center">
                                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Cleaning</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.pendingCleaning || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center">
                                <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today Check-ins</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardData.todayCheckins || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Occupancy Report */}
            {activeReport === 'occupancy' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Occupancy Trends</h3>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Period:</span>
                            <select
                                value={occupancyPeriod}
                                onChange={async (e) => {
                                    const value = e.target.value;
                                    setOccupancyPeriod(value);
                                    try {
                                        const res = await reportsAPI.getOccupancy(value);
                                        if (res.success) {
                                            setOccupancyData(res.data);
                                        }
                                    } catch (err) {
                                        console.error('Error fetching occupancy data:', err);
                                    }
                                }}
                                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                                <option value="7">Last 7 days (Weekly)</option>
                                <option value="30">Last 30 days (Monthly)</option>
                            </select>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={occupancyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="bookings" stackId="1" stroke="#8884d8" fill="#8884d8" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Revenue Report */}
            {activeReport === 'revenue' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trends</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Comprehensive Report */}
            {activeReport === 'comprehensive' && (
                <div className="space-y-6">
                    {Object.keys(comprehensiveData).length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bookings Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Total Bookings:</span>
                                            <span className="font-semibold">{comprehensiveData.bookings?.total || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Total Revenue:</span>
                                            <span className="font-semibold">₹{comprehensiveData.bookings?.totalRevenue || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                                            <span className="font-semibold text-green-600">{comprehensiveData.bookings?.completed || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Cancelled:</span>
                                            <span className="font-semibold text-red-600">{comprehensiveData.bookings?.cancelled || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Total Income:</span>
                                            <span className="font-semibold text-green-600">₹{comprehensiveData.accounts?.totalIncome || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Total Expense:</span>
                                            <span className="font-semibold text-red-600">₹{comprehensiveData.accounts?.totalExpense || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Net Profit:</span>
                                            <span className={`font-semibold ${(comprehensiveData.accounts?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ₹{comprehensiveData.accounts?.netProfit || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Housekeeping Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
                                            <span className="font-semibold">{comprehensiveData.housekeeping?.totalTasks || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                                            <span className="font-semibold text-green-600">{comprehensiveData.housekeeping?.completed || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                                            <span className="font-semibold text-yellow-600">{comprehensiveData.housekeeping?.pending || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No Comprehensive Data
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Click "Generate Report" to fetch comprehensive data for the selected date range.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading report data...</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
