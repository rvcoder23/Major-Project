import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Filter, CheckCircle, Clock, AlertCircle,
    Bed, Calendar, User, Edit, Trash2, Eye, XCircle, CheckSquare,
    X, AlertTriangle, Star, RefreshCw, ListChecks
} from 'lucide-react';
import { housekeepingAPI, roomsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Housekeeping = () => {
    const [tasks, setTasks] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pending: 0,
        completedToday: 0,
        overdue: 0,
        inProgress: 0,
        awaitingInspection: 0,
        urgent: 0
    });

    // Filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [taskTypeFilter, setTaskTypeFilter] = useState('');
    const [staffFilter, setStaffFilter] = useState('');

    // Modals
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
    const [showInspectionModal, setShowInspectionModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        room_id: '',
        task_type: 'Regular Cleaning',
        priority: 'Medium',
        assigned_staff_id: '',
        estimated_duration: 30,
        due_time: '',
        special_instructions: '',
        cleaning_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
        fetchDashboardStats();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [statusFilter, priorityFilter, taskTypeFilter, staffFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchTasks(),
                fetchRooms(),
                fetchStaff(),
                fetchDashboardStats()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (priorityFilter) params.priority = priorityFilter;
            if (taskTypeFilter) params.task_type = taskTypeFilter;
            if (staffFilter) params.staff_id = staffFilter;

            const response = await housekeepingAPI.getAll(params);
            if (response.success) {
                setTasks(response.data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to fetch tasks');
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

    const fetchStaff = async () => {
        try {
            const response = await housekeepingAPI.getStaff();
            if (response.success) {
                setStaff(response.data);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await housekeepingAPI.getDashboardStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();
        try {
            const response = await housekeepingAPI.create(formData);
            if (response.success) {
                toast.success('Task assigned successfully');
                setShowAssignModal(false);
                setFormData({
                    room_id: '',
                    task_type: 'Regular Cleaning',
                    priority: 'Medium',
                    assigned_staff_id: '',
                    estimated_duration: 30,
                    due_time: '',
                    special_instructions: '',
                    cleaning_date: new Date().toISOString().split('T')[0]
                });
                fetchData();
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to assign task');
            console.error('Error assigning task:', error);
        }
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            const response = await housekeepingAPI.updateStatus(taskId, newStatus);
            if (response.success) {
                toast.success(`Task status updated to ${newStatus}`);
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to update status');
            console.error('Error updating status:', error);
        }
    };

    const handleChecklistUpdate = async (taskId, checklist) => {
        try {
            const response = await housekeepingAPI.updateChecklist(taskId, checklist);
            if (response.success) {
                toast.success('Checklist updated');
                fetchData();
                if (selectedTask?.id === taskId) {
                    setSelectedTask({ ...selectedTask, checklist });
                }
            }
        } catch (error) {
            toast.error('Failed to update checklist');
            console.error('Error updating checklist:', error);
        }
    };

    const handleInspection = async (inspectionStatus, supervisorNotes) => {
        try {
            const response = await housekeepingAPI.updateInspection(selectedTask.id, {
                inspection_status: inspectionStatus,
                supervisor_notes: supervisorNotes,
                inspected_by: 'admin'
            });
            if (response.success) {
                toast.success(`Inspection ${inspectionStatus}`);
                setShowInspectionModal(false);
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to update inspection');
            console.error('Error updating inspection:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await housekeepingAPI.delete(taskId);
            if (response.success) {
                toast.success('Task deleted');
                fetchData();
            }
        } catch (error) {
            toast.error('Failed to delete task');
            console.error('Error deleting task:', error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = !searchTerm || 
            task.rooms?.room_number?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.staff?.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.task_type?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getInspectionColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        return timeString.substring(0, 5); // HH:MM format
    };

    const calculateChecklistProgress = (checklist) => {
        if (!checklist || !Array.isArray(checklist)) return { completed: 0, total: 0, percentage: 0 };
        const total = checklist.length;
        const completed = checklist.filter(item => item.completed).length;
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Housekeeping Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage cleaning tasks and staff assignments
                    </p>
                </div>
                <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Assign Task
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center">
                        <Clock className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center">
                        <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Today</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedToday}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center">
                        <RefreshCw className="h-6 w-6 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center">
                        <ListChecks className="h-6 w-6 text-purple-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Awaiting Inspection</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.awaitingInspection}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.urgent}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by room, staff, or task type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Priorities</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <select
                        value={taskTypeFilter}
                        onChange={(e) => setTaskTypeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Types</option>
                        <option value="Regular Cleaning">Regular Cleaning</option>
                        <option value="Deep Cleaning">Deep Cleaning</option>
                        <option value="VIP Service">VIP Service</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No tasks found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm || statusFilter || priorityFilter || taskTypeFilter
                                ? 'Try adjusting your filters.'
                                : 'Create your first task to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Task Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Priority</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Staff</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Checklist</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inspection</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredTasks.map((task) => {
                                    const checklistProgress = calculateChecklistProgress(task.checklist);
                                    return (
                                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Bed className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {task.rooms?.room_number} ({task.rooms?.room_type})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {task.task_type || 'Regular Cleaning'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority || 'Medium')}`}>
                                                    {task.priority || 'Medium'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {task.staff?.staff_name || 'Unassigned'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${checklistProgress.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                        {checklistProgress.completed}/{checklistProgress.total}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getInspectionColor(task.inspection_status || 'Pending')}`}>
                                                    {task.inspection_status || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTask(task);
                                                            setShowTaskDetailsModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {task.status === 'Completed' && task.inspection_status === 'Pending' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTask(task);
                                                                setShowInspectionModal(true);
                                                            }}
                                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                            title="Inspect"
                                                        >
                                                            <CheckSquare className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                                                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Completed">Completed</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assign Task Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Task</h2>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleAssignTask} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Room *
                                    </label>
                                    <select
                                        required
                                        value={formData.room_id}
                                        onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Select Room</option>
                                        {rooms.filter(room => room.status === 'Cleaning' || room.status === 'Occupied').map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.room_number} - {room.room_type} ({room.status})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Task Type *
                                    </label>
                                    <select
                                        required
                                        value={formData.task_type}
                                        onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Regular Cleaning">Regular Cleaning</option>
                                        <option value="Deep Cleaning">Deep Cleaning</option>
                                        <option value="VIP Service">VIP Service</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Priority *
                                    </label>
                                    <select
                                        required
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Assign Staff
                                    </label>
                                    <select
                                        value={formData.assigned_staff_id}
                                        onChange={(e) => setFormData({ ...formData, assigned_staff_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Unassigned</option>
                                        {staff.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.staff_name} - {member.designation}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Estimated Duration (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimated_duration}
                                        onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        min="15"
                                        step="15"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Due Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.due_time}
                                        onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Cleaning Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.cleaning_date}
                                        onChange={(e) => setFormData({ ...formData, cleaning_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Special Instructions
                                    </label>
                                    <textarea
                                        value={formData.special_instructions}
                                        onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                                        rows={3}
                                        placeholder="Any special instructions for the housekeeping staff..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Assign Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Details Modal */}
            {showTaskDetailsModal && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Details</h2>
                            <button
                                onClick={() => {
                                    setShowTaskDetailsModal(false);
                                    setSelectedTask(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Task Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Room</label>
                                    <p className="text-gray-900 dark:text-white">{selectedTask.rooms?.room_number} ({selectedTask.rooms?.room_type})</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Type</label>
                                    <p className="text-gray-900 dark:text-white">{selectedTask.task_type}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                                        {selectedTask.priority}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTask.status)}`}>
                                        {selectedTask.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Staff</label>
                                    <p className="text-gray-900 dark:text-white">{selectedTask.staff?.staff_name || 'Unassigned'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inspection Status</label>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getInspectionColor(selectedTask.inspection_status)}`}>
                                        {selectedTask.inspection_status || 'Pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Checklist */}
                            {selectedTask.checklist && Array.isArray(selectedTask.checklist) && selectedTask.checklist.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cleaning Checklist
                                    </label>
                                    <div className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                        {selectedTask.checklist.map((item, index) => (
                                            <label key={index} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={item.completed || false}
                                                    onChange={(e) => {
                                                        const updatedChecklist = [...selectedTask.checklist];
                                                        updatedChecklist[index] = { ...item, completed: e.target.checked };
                                                        handleChecklistUpdate(selectedTask.id, updatedChecklist);
                                                    }}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                    disabled={selectedTask.status === 'Completed'}
                                                />
                                                <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {item.item}
                                                    {item.required && <span className="text-red-500 ml-1">*</span>}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedTask.special_instructions && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Instructions</label>
                                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{selectedTask.special_instructions}</p>
                                </div>
                            )}

                            {selectedTask.notes && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{selectedTask.notes}</p>
                                </div>
                            )}

                            {selectedTask.supervisor_notes && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor Notes</label>
                                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{selectedTask.supervisor_notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        setShowTaskDetailsModal(false);
                                        setSelectedTask(null);
                                    }}
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Close
                                </button>
                                {selectedTask.status !== 'Completed' && selectedTask.status !== 'Cancelled' && (
                                    <button
                                        onClick={() => handleDeleteTask(selectedTask.id)}
                                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Delete Task
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspection Modal */}
            {showInspectionModal && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Room Inspection</h2>
                            <button
                                onClick={() => {
                                    setShowInspectionModal(false);
                                    setSelectedTask(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Room
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {selectedTask.rooms?.room_number} ({selectedTask.rooms?.room_type})
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Supervisor Notes
                                </label>
                                <textarea
                                    id="supervisorNotes"
                                    rows={4}
                                    placeholder="Enter inspection notes..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => handleInspection('Rejected', document.getElementById('supervisorNotes')?.value || '')}
                                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleInspection('Approved', document.getElementById('supervisorNotes')?.value || '')}
                                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Housekeeping;
