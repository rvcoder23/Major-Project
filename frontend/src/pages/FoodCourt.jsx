import React, { useState, useEffect, useMemo } from 'react';
import { Utensils, Plus, Search, ShoppingCart, Receipt, ChefHat, Edit, Trash2, Clock, CheckCircle, XCircle, Eye, DollarSign } from 'lucide-react';
import { foodAPI } from '../services/api';

const FoodCourt = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'orders', 'kitchen'
    const [revenue, setRevenue] = useState({ total_revenue: 0, order_count: 0 });

    const [menuForm, setMenuForm] = useState({
        item_name: '',
        category: '',
        price: 0
    });

    const [orderForm, setOrderForm] = useState({
        item_id: '',
        quantity: 1,
        customer_name: '',
        table_number: ''
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [menuRes, ordersRes, categoriesRes, revenueRes] = await Promise.all([
                foodAPI.getMenu(),
                foodAPI.getTodayOrders(),
                foodAPI.getCategories(),
                foodAPI.getTodayRevenue()
            ]);
            
            if (menuRes.success) setMenuItems(menuRes.data);
            if (ordersRes.success) setOrders(ordersRes.data);
            if (categoriesRes.success) setCategories(categoriesRes.data);
            if (revenueRes.success) setRevenue(revenueRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMenu = useMemo(() => {
        let filtered = menuItems;
        
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (selectedCategory) {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }
        
        return filtered;
    }, [menuItems, searchTerm, selectedCategory]);

    const filteredOrders = useMemo(() => {
        if (activeTab === 'kitchen') {
            return orders.filter(order => ['Pending', 'Preparing'].includes(order.status));
        }
        return orders;
    }, [orders, activeTab]);

    const openMenuModal = (item = null) => {
        if (item) {
            setMenuForm({
                item_name: item.item_name,
                category: item.category,
                price: item.price
            });
        } else {
            setMenuForm({ item_name: '', category: '', price: 0 });
        }
        setShowMenuModal(true);
    };

    const openOrderModal = (item = null) => {
        if (item) {
            setOrderForm({
                item_id: item.id,
                quantity: 1,
                customer_name: '',
                table_number: ''
            });
        } else {
            setOrderForm({ item_id: '', quantity: 1, customer_name: '', table_number: '' });
        }
        setShowOrderModal(true);
    };

    const handleMenuSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                item_name: menuForm.item_name.trim(),
                category: menuForm.category.trim(),
                price: Number(menuForm.price)
            };
            
            const res = await foodAPI.createMenuItem(payload);
            if (res.success) {
                setShowMenuModal(false);
                fetchAll();
            }
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to create menu item');
        }
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                item_id: Number(orderForm.item_id),
                quantity: Number(orderForm.quantity),
                customer_name: orderForm.customer_name.trim() || null,
                table_number: orderForm.table_number ? Number(orderForm.table_number) : null
            };
            
            const res = await foodAPI.createOrder(payload);
            if (res.success) {
                setShowOrderModal(false);
                fetchAll();
            }
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to create order');
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const res = await foodAPI.updateOrderStatus(orderId, newStatus);
            if (res.success) {
                fetchAll();
            }
        } catch (err) {
            alert('Failed to update order status');
        }
    };

    const handleDeleteMenuItem = async (itemId) => {
        if (!window.confirm('Delete this menu item?')) return;
        try {
            const res = await foodAPI.deleteMenuItem(itemId);
            if (res.success) fetchAll();
        } catch (err) {
            alert('Failed to delete menu item');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'Preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Served': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending': return <Clock className="h-4 w-4" />;
            case 'Preparing': return <ChefHat className="h-4 w-4" />;
            case 'Ready': return <CheckCircle className="h-4 w-4" />;
            case 'Served': return <CheckCircle className="h-4 w-4" />;
            case 'Cancelled': return <XCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Food Court & POS
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage food menu, orders, and point of sale operations
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => openOrderModal()}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Order
                    </button>
                    <button
                        onClick={() => openMenuModal()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Menu Item
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Utensils className="h-8 w-8 text-orange-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Menu Items</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{menuItems.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <ShoppingCart className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Orders</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{revenue.order_count}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{revenue.total_revenue}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <ChefHat className="h-8 w-8 text-purple-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kitchen Orders</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {orders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['menu', 'orders', 'kitchen'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Menu Tab */}
            {activeTab === 'menu' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading menu...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMenu.map((item) => (
                                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.item_name}</h3>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => openOrderModal(item)}
                                                className="p-1 text-green-600 hover:text-green-800 dark:text-green-400"
                                                title="Add to Order"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openMenuModal(item)}
                                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMenuItem(item.id)}
                                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.category}</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">₹{item.price}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading orders...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Order #</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Item</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Quantity</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Customer</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Table</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Time</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => (
                                        <tr key={order.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="py-3 px-4 text-gray-900 dark:text-white font-mono text-sm">{order.order_number}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{order.food_menu?.item_name}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{order.quantity}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{order.customer_name || '-'}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{order.table_number || '-'}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">₹{order.total_amount}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="ml-1">{order.status}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">
                                                {new Date(order.order_date).toLocaleTimeString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowOrderDetailsModal(true);
                                                        }}
                                                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    {order.status === 'Pending' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'Preparing')}
                                                            className="px-2 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                                        >
                                                            Start
                                                        </button>
                                                    )}
                                                    {order.status === 'Preparing' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'Ready')}
                                                            className="px-2 py-1 text-white bg-green-600 hover:bg-green-700 rounded text-xs"
                                                        >
                                                            Ready
                                                        </button>
                                                    )}
                                                    {order.status === 'Ready' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'Served')}
                                                            className="px-2 py-1 text-white bg-gray-600 hover:bg-gray-700 rounded text-xs"
                                                        >
                                                            Served
                                                        </button>
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

            {/* Kitchen Tab */}
            {activeTab === 'kitchen' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kitchen Orders</h3>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading kitchen orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Kitchen Orders</h3>
                            <p className="text-gray-600 dark:text-gray-400">All orders are completed or served.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredOrders.map((order) => (
                                <div key={order.id} className={`p-4 rounded-lg border-2 ${
                                    order.status === 'Pending' 
                                        ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800' 
                                        : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{order.order_number}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{order.food_menu?.item_name}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Qty: {order.quantity}</p>
                                    {order.customer_name && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Customer: {order.customer_name}</p>
                                    )}
                                    {order.table_number && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Table: {order.table_number}</p>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900 dark:text-white">₹{order.total_amount}</span>
                                        <div className="flex space-x-2">
                                            {order.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Preparing')}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                >
                                                    Start Cooking
                                                </button>
                                            )}
                                            {order.status === 'Preparing' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'Ready')}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                >
                                                    Mark Ready
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Menu Modal */}
            {showMenuModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Menu Item</h2>
                        <form onSubmit={handleMenuSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={menuForm.item_name}
                                        onChange={(e) => setMenuForm({ ...menuForm, item_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <input
                                        type="text"
                                        required
                                        value={menuForm.category}
                                        onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={menuForm.price}
                                        onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowMenuModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Order Modal */}
            {showOrderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">New Order</h2>
                        <form onSubmit={handleOrderSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Menu Item</label>
                                    <select
                                        required
                                        value={orderForm.item_id}
                                        onChange={(e) => setOrderForm({ ...orderForm, item_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Select Item</option>
                                        {menuItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.item_name} - ₹{item.price}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={orderForm.quantity}
                                        onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name (Optional)</label>
                                    <input
                                        type="text"
                                        value={orderForm.customer_name}
                                        onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Table Number (Optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={orderForm.table_number}
                                        onChange={(e) => setOrderForm({ ...orderForm, table_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowOrderModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {showOrderDetailsModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Details</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Number</label>
                                    <p className="text-gray-900 dark:text-white font-mono">{selectedOrder.order_number}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                        {getStatusIcon(selectedOrder.status)}
                                        <span className="ml-1">{selectedOrder.status}</span>
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Item</label>
                                    <p className="text-gray-900 dark:text-white">{selectedOrder.food_menu?.item_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                                    <p className="text-gray-900 dark:text-white">{selectedOrder.quantity}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
                                    <p className="text-gray-900 dark:text-white">{selectedOrder.customer_name || 'Walk-in'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Table</label>
                                    <p className="text-gray-900 dark:text-white">{selectedOrder.table_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</label>
                                    <p className="text-gray-900 dark:text-white font-bold">₹{selectedOrder.total_amount}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Time</label>
                                    <p className="text-gray-900 dark:text-white">{new Date(selectedOrder.order_date).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowOrderDetailsModal(false)}
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

export default FoodCourt;
