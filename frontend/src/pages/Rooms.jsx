import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    QrCode,
    Bed,
    Wifi,
    Car,
    Coffee,
    Tv,
    Wind
} from 'lucide-react';
import { roomsAPI } from '../services/api';
import { formatCurrency, getStatusColor, cn } from '../utils/helpers';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [formData, setFormData] = useState({
        room_number: '',
        room_type: '',
        rate_per_night: '',
        status: 'Available',
        description: ''
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await roomsAPI.getAll();
            setRooms(response.data);
        } catch (error) {
            toast.error('Failed to fetch rooms');
            console.error('Rooms error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        try {
            await roomsAPI.create(formData);
            toast.success('Room added successfully');
            setShowAddModal(false);
            setFormData({
                room_number: '',
                room_type: '',
                rate_per_night: '',
                status: 'Available',
                description: ''
            });
            fetchRooms();
        } catch (error) {
            toast.error('Failed to add room');
            console.error('Add room error:', error);
        }
    };

    const handleEditRoom = async (e) => {
        e.preventDefault();
        try {
            await roomsAPI.update(selectedRoom.id, formData);
            toast.success('Room updated successfully');
            setShowEditModal(false);
            setSelectedRoom(null);
            fetchRooms();
        } catch (error) {
            toast.error('Failed to update room');
            console.error('Update room error:', error);
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await roomsAPI.delete(roomId);
                toast.success('Room deleted successfully');
                fetchRooms();
            } catch (error) {
                toast.error('Failed to delete room');
                console.error('Delete room error:', error);
            }
        }
    };

    const handleStatusChange = async (roomId, newStatus) => {
        try {
            await roomsAPI.updateStatus(roomId, newStatus);
            toast.success('Room status updated');
            fetchRooms();
        } catch (error) {
            toast.error('Failed to update room status');
            console.error('Status update error:', error);
        }
    };

    const openEditModal = (room) => {
        setSelectedRoom(room);
        setFormData({
            room_number: room.room_number,
            room_type: room.room_type,
            rate_per_night: room.rate_per_night,
            status: room.status,
            description: room.description || ''
        });
        setShowEditModal(true);
    };

    const openQRModal = (room) => {
        setSelectedRoom(room);
        setShowQRModal(true);
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.room_type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || room.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getRoomAmenities = (roomType) => {
        const amenities = {
            'Standard': [Wifi, Tv, Coffee],
            'Deluxe': [Wifi, Tv, Coffee, Wind],
            'Suite': [Wifi, Tv, Coffee, Wind, Car]
        };
        return amenities[roomType] || [Wifi, Tv];
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
                        Room Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage hotel rooms, rates, and availability
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Room
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search rooms..."
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
                            <option value="All">All Status</option>
                            <option value="Available">Available</option>
                            <option value="Occupied">Occupied</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Cleaning">Cleaning</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                    <div
                        key={room.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Bed className="h-6 w-6 text-blue-600 mr-2" />
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        Room {room.room_number}
                                    </h3>
                                </div>
                                <span className={cn(
                                    'px-2 py-1 text-xs font-medium rounded-full',
                                    getStatusColor(room.status)
                                )}>
                                    {room.status}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Room Type</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{room.room_type}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Rate per Night</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(room.rate_per_night)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Amenities</p>
                                    <div className="flex space-x-2 mt-1">
                                        {getRoomAmenities(room.room_type).map((Icon, index) => (
                                            <Icon key={index} className="h-4 w-4 text-gray-500" />
                                        ))}
                                    </div>
                                </div>

                                {room.description && (
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{room.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openEditModal(room)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => openQRModal(room)}
                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors"
                                    >
                                        <QrCode className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRoom(room.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <select
                                    value={room.status}
                                    onChange={(e) => handleStatusChange(room.id, e.target.value)}
                                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Cleaning">Cleaning</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Room Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Add New Room
                        </h3>
                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Room Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.room_number}
                                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Room Type
                                </label>
                                <select
                                    required
                                    value={formData.room_type}
                                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select Type</option>
                                    <option value="Standard">Standard</option>
                                    <option value="Deluxe">Deluxe</option>
                                    <option value="Suite">Suite</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rate per Night
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.rate_per_night}
                                    onChange={(e) => setFormData({ ...formData, rate_per_night: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Room
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Room Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Edit Room
                        </h3>
                        <form onSubmit={handleEditRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Room Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.room_number}
                                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Room Type
                                </label>
                                <select
                                    required
                                    value={formData.room_type}
                                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Deluxe">Deluxe</option>
                                    <option value="Suite">Suite</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rate per Night
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.rate_per_night}
                                    onChange={(e) => setFormData({ ...formData, rate_per_night: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Available">Available</option>
                                    <option value="Occupied">Occupied</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Cleaning">Cleaning</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Update Room
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && selectedRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Room QR Code
                        </h3>
                        <div className="text-center">
                            <div className="bg-white p-4 rounded-lg inline-block">
                                <QRCode
                                    value={`Room ${selectedRoom.room_number} - ${selectedRoom.room_type} - ${formatCurrency(selectedRoom.rate_per_night)}`}
                                    size={200}
                                />
                            </div>
                            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                Room {selectedRoom.room_number} - {selectedRoom.room_type}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="w-full mt-6 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rooms;
