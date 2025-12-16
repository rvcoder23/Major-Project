import React, { useState, useEffect } from 'react';
import {
    Users, Plus, Search, Filter, CheckCircle, Clock, AlertCircle,
    Bed, Calendar, User, Edit, Trash2, Eye, XCircle, CheckSquare,
    X, AlertTriangle, Star, RefreshCw, ListChecks, UserPlus, Phone, Mail
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
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);

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

    // Staff form state
    const [staffFormData, setStaffFormData] = useState({
        staff_name: '',
        employee_id: '',
        phone_number: '',
        email: '',
        designation: 'Housekeeping Staff',
        shift: 'Day',
        status: 'Active',
        specialization: ''
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

    const handleEditStaff = (staffMember) => {
        setSelectedStaff(staffMember);
        setStaffFormData({
            staff_name: staffMember.staff_name || '',
            employee_id: staffMember.employee_id || '',
            phone_number: staffMember.phone_number || '',
            email: staffMember.email || '',
            designation: staffMember.designation || 'Housekeeping Staff',
            shift: staffMember.shift || 'Day',
            status: staffMember.status || 'Active',
            specialization: staffMember.specialization || ''
        });
        setShowStaffModal(true);
    };

    const handleSaveStaff = async (e) => {
        e.preventDefault();
        try {
            if (selectedStaff) {
                // Update existing staff
                const response = await housekeepingAPI.updateStaff(selectedStaff.id, staffFormData);
                if (response.success) {
                    toast.success('Staff updated successfully');
                    setShowStaffModal(false);
                    setSelectedStaff(null);
                    fetchStaff();
                    fetchTasks(); // Refresh tasks to update staff info
                }
            } else {
                // Create new staff
                const response = await housekeepingAPI.createStaff(staffFormData);
                if (response.success) {
                    toast.success('Staff member added successfully');
                    setShowStaffModal(false);
                    setStaffFormData({
                        staff_name: '',
                        employee_id: '',
                        phone_number: '',
                        email: '',
                        designation: 'Housekeeping Staff',
                        shift: 'Day',
                        status: 'Active',
                        specialization: ''
                    });
                    fetchStaff();
                }
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to save staff');
            console.error('Error saving staff:', error);
        }
    };

    const handleDeleteStaff = async (staffId) => {
        if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;

        try {
            const response = await housekeepingAPI.deleteStaff(staffId);
            if (response.success) {
                toast.success('Staff member deleted successfully');
                fetchStaff();
                fetchTasks();
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || 'Failed to delete staff');
            console.error('Error deleting staff:', error);
        }
    };

    const handleReassignTask = async (taskId, newStaffId) => {
        try {
            const response = await housekeepingAPI.update(taskId, { assigned_staff_id: newStaffId });
            if (response.success) {
                toast.success('Task reassigned successfully');
                setShowReassignModal(false);
                fetchTasks();
            }
        } catch (error) {
            toast.error('Failed to reassign task');
            console.error('Error reassigning task:', error);
        }
    };

    const getAvailableStaff = () => {
        return staff.filter(s => s.status === 'Active');
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center">
                        <Users className="h-6 w-6 text-indigo-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Staff</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {staff.filter(s => s.status === 'Active').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff Overview Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Staff Overview
                    </h2>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {staff.filter(s => s.status === 'Active').length} Active / {staff.length} Total
                        </span>
                        <button
                            onClick={() => {
                                setSelectedStaff(null);
                                setStaffFormData({
                                    staff_name: '',
                                    employee_id: '',
                                    phone_number: '',
                                    email: '',
                                    designation: 'Housekeeping Staff',
                                    shift: 'Day',
                                    status: 'Active',
                                    specialization: ''
                                });
                                setShowStaffModal(true);
                            }}
                            className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Staff
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {staff.map((member) => {
                        const assignedTasks = tasks.filter(t => t.assigned_staff_id === member.id);
                        const activeTasks = assignedTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
                        const completedToday = assignedTasks.filter(t => 
                            t.status === 'Completed' && 
                            t.cleaning_date === new Date().toISOString().split('T')[0]
                        ).length;
                        
                        const getStatusColor = (status) => {
                            switch(status) {
                                case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                                case 'On Leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
                                case 'Inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                                default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                            }
                        };

                        const getShiftColor = (shift) => {
                            switch(shift) {
                                case 'Day': return 'text-blue-600 dark:text-blue-400';
                                case 'Night': return 'text-purple-600 dark:text-purple-400';
                                case 'Flexible': return 'text-indigo-600 dark:text-indigo-400';
                                default: return 'text-gray-600 dark:text-gray-400';
                            }
                        };
                        
                        return (
                            <div 
                                key={member.id} 
                                className={`bg-gradient-to-br rounded-lg p-4 border-2 transition-all ${
                                    member.status === 'Active' 
                                        ? 'from-blue-50 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-blue-200 dark:border-blue-700'
                                        : 'from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-gray-200 dark:border-gray-600 opacity-75'
                                } hover:shadow-lg`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                                            member.status === 'Active' ? 'bg-blue-600' : 'bg-gray-500'
                                        }`}>
                                            {member.staff_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                                {member.staff_name}
                                            </h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {member.designation}
                                            </p>
                                            <p className={`text-xs font-medium mt-0.5 ${getShiftColor(member.shift)}`}>
                                                {member.shift} Shift
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-1">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(member.status)}`}>
                                            {member.status}
                                        </span>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => handleEditStaff(member)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                                                title="Edit Staff"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            {member.status !== 'Active' && (
                                                <button
                                                    onClick={() => handleDeleteStaff(member.id)}
                                                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                                    title="Delete Staff"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {member.employee_id && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        ID: {member.employee_id}
                                    </p>
                                )}
                                
                                {member.specialization && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                        <span className="font-medium">Specialization:</span> {member.specialization}
                                    </p>
                                )}
                                
                                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${member.status === 'Active' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
                                            {activeTasks}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Active Tasks</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-lg font-bold ${member.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                            {completedToday}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Completed Today</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    {member.phone_number && (
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <Phone className="h-3 w-3 mr-1" />
                                            {member.phone_number}
                                        </div>
                                    )}
                                    {member.email && (
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <Mail className="h-3 w-3 mr-1" />
                                            {member.email.substring(0, 15)}...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {staff.length === 0 && (
                        <div className="col-span-full text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">No staff members found</p>
                            <button
                                onClick={() => {
                                    setSelectedStaff(null);
                                    setStaffFormData({
                                        staff_name: '',
                                        employee_id: '',
                                        phone_number: '',
                                        email: '',
                                        designation: 'Housekeeping Staff',
                                        shift: 'Day',
                                        status: 'Active',
                                        specialization: ''
                                    });
                                    setShowStaffModal(true);
                                }}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add First Staff Member
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

                    <select
                        value={staffFilter}
                        onChange={(e) => setStaffFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Staff</option>
                        {staff.map(member => (
                            <option key={member.id} value={member.id}>
                                {member.staff_name}
                            </option>
                        ))}
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
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {task.staff ? (
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-xs">
                                                            {task.staff.staff_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {task.staff.staff_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {task.staff.designation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 dark:text-gray-500 italic">Unassigned</span>
                                                )}
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
                                                    {task.status !== 'Completed' && task.status !== 'Cancelled' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTask(task);
                                                                    setShowReassignModal(true);
                                                                }}
                                                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                                                title="Reassign Task"
                                                            >
                                                                <User className="h-4 w-4" />
                                                            </button>
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
                                                        </>
                                                    )}
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
                                        {getAvailableStaff().map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.staff_name} - {member.designation} ({member.shift} Shift)
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Staff</label>
                                    {selectedTask.staff ? (
                                        <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {selectedTask.staff.staff_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {selectedTask.staff.staff_name}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {selectedTask.staff.designation}
                                                </p>
                                                {selectedTask.staff.employee_id && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                                        ID: {selectedTask.staff.employee_id}
                                                    </p>
                                                )}
                                                {selectedTask.staff.specialization && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                        Specialization: {selectedTask.staff.specialization}
                                                    </p>
                                                )}
                                                {selectedTask.staff.phone_number && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                        📞 {selectedTask.staff.phone_number}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 italic">Unassigned</p>
                                    )}
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
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowTaskDetailsModal(false);
                                                setShowReassignModal(true);
                                            }}
                                            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                                        >
                                            <User className="h-4 w-4 mr-2" />
                                            Reassign
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(selectedTask.id)}
                                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Delete Task
                                        </button>
                                    </>
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

            {/* Staff Edit Modal */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowStaffModal(false);
                                    setSelectedStaff(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl font-bold leading-none"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSaveStaff} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Staff Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={staffFormData.staff_name}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, staff_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        value={staffFormData.employee_id}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, employee_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={staffFormData.phone_number}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, phone_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={staffFormData.email}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Designation *
                                    </label>
                                    <select
                                        required
                                        value={staffFormData.designation}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, designation: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Housekeeping Staff">Housekeeping Staff</option>
                                        <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                                        <option value="Housekeeping Manager">Housekeeping Manager</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Shift *
                                    </label>
                                    <select
                                        required
                                        value={staffFormData.shift}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, shift: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Day">Day</option>
                                        <option value="Night">Night</option>
                                        <option value="Flexible">Flexible</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        required
                                        value={staffFormData.status}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Specialization
                                    </label>
                                    <input
                                        type="text"
                                        value={staffFormData.specialization}
                                        onChange={(e) => setStaffFormData({ ...staffFormData, specialization: e.target.value })}
                                        placeholder="e.g., Regular Cleaning, Deep Cleaning, VIP Service, Maintenance"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Comma-separated list of specializations
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowStaffModal(false);
                                        setSelectedStaff(null);
                                    }}
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {selectedStaff ? 'Update Staff' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Reassign Modal */}
            {showReassignModal && selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reassign Task</h2>
                            <button
                                onClick={() => {
                                    setShowReassignModal(false);
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
                                    Current Assignment
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {selectedTask.staff?.staff_name || 'Unassigned'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Reassign To *
                                </label>
                                <select
                                    id="reassignStaff"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Unassigned</option>
                                    {getAvailableStaff().map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.staff_name} - {member.designation} ({member.shift} Shift)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowReassignModal(false);
                                        setSelectedTask(null);
                                    }}
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        const newStaffId = document.getElementById('reassignStaff')?.value || '';
                                        handleReassignTask(selectedTask.id, newStaffId);
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Reassign
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
