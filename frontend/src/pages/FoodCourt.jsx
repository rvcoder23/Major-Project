import React, { useState, useEffect, useMemo } from 'react';
import { Utensils, Plus, Search, ShoppingCart, Receipt, ChefHat, Edit, Trash2, Clock, CheckCircle, XCircle, Eye, IndianRupee } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { foodAPI, bookingsAPI, billsAPI } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FOOD_CATEGORIES = [
    "Beverages",
    "Starters",
    "Roti / Bread",
    "Main Course",
    "Rice / Biryani",
    "Snacks",
    "Desserts",
    "Salads / Sides",
    "Combos / Thali"
];

const FoodCourt = () => {
    // ... (existing state)

    const handleGenerateBill = async (order) => {
        try {
            const toastId = toast.loading('Generating bill...');
            const res = await billsAPI.generateForFoodOrder(order.id, {});

            if (res.success) {
                const bill = res.data;
                const items = bill.items || [];

                // Generate PDF
                const doc = new jsPDF();

                // Header
                doc.setFillColor(63, 81, 181); // Indigo color
                doc.rect(0, 0, 210, 40, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text('HOTEL GRAND', 105, 15, { align: 'center' });
                doc.setFontSize(12);
                doc.text('Food Court Receipt', 105, 25, { align: 'center' });

                // Bill Details
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.text(`Invoice #: ${bill.invoice_number}`, 15, 50);
                doc.text(`Date: ${new Date(bill.bill_date).toLocaleDateString()}`, 15, 56);
                doc.text(`Time: ${bill.bill_time}`, 15, 62);

                if (order.table_number) {
                    doc.text(`Table: ${order.table_number}`, 140, 50);
                } else if (order.room_number) {
                    doc.text(`Room: ${order.room_number}`, 140, 50);
                }

                doc.text(`Customer: ${bill.guest_name}`, 140, 56);

                // Items Table
                const tableData = items.map(item => [
                    item.item_description,
                    item.quantity,
                    `Rs. ${item.unit_price}`,
                    `Rs. ${item.total_amount}`
                ]);

                doc.autoTable({
                    startY: 70,
                    head: [['Item', 'Qty', 'Price', 'Total']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: { fillColor: [63, 81, 181] }
                });

                // Totals
                const finalY = doc.lastAutoTable.finalY + 10;
                doc.text(`Subtotal: Rs. ${bill.subtotal}`, 140, finalY);
                doc.text(`GST (${bill.gst_rate}%): Rs. ${bill.gst_amount}`, 140, finalY + 6);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Total: Rs. ${bill.total_amount}`, 140, finalY + 14);

                // Footer
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.text('Thank you for dining with us!', 105, 280, { align: 'center' });

                doc.save(`Food_Bill_${bill.invoice_number}.pdf`);

                toast.success('Bill generated and downloaded', { id: toastId });
                fetchAll(); // Refresh to see update if any
            }
        } catch (err) {
            console.error('Bill generation error:', err);
            toast.error('Failed to generate bill');
        }
    };

    const [menuItems, setMenuItems] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    // const [categories, setCategories] = useState([]); // Removed
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
        table_number: 1,
        plate_type: 'Full',
        payment_method: 'Cash',
        order_type: 'Restaurant'
    });
    const [orderCalculation, setOrderCalculation] = useState({
        baseAmount: 0,
        gstRate: 0,
        gstAmount: 0,
        totalAmount: 0
    });

    const [paymentMethods, setPaymentMethods] = useState(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer']);

    useEffect(() => {
        fetchAll();
        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        calculateOrderAmount();
    }, [orderForm.item_id, orderForm.quantity, orderForm.plate_type, menuItems]);

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

    const calculateOrderAmount = () => {
        if (!orderForm.item_id) {
            setOrderCalculation({
                baseAmount: 0,
                gstRate: 0,
                gstAmount: 0,
                totalAmount: 0
            });
            return;
        }

        const selectedItem = menuItems.find(item => item.id === parseInt(orderForm.item_id));
        if (!selectedItem) return;

        let unitPrice = selectedItem.full_plate_price || selectedItem.price;
        if (orderForm.plate_type === 'Half') {
            unitPrice = selectedItem.half_plate_price || Math.round(unitPrice * 0.6);
        }

        const baseAmount = unitPrice * orderForm.quantity;
        const gstRate = calculateGstRate(baseAmount);
        const gstAmount = Math.round(baseAmount * (gstRate / 100) * 100) / 100;
        const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100;

        setOrderCalculation({
            baseAmount,
            gstRate,
            gstAmount,
            totalAmount
        });
    };

    const calculateGstRate = (baseAmount) => {
        const amount = Number(baseAmount) || 0;
        if (amount >= 0 && amount <= 5499) return 12;
        if (amount >= 5500 && amount <= 7499) return 18;
        if (amount >= 7500) return 28;
        return 12;
    };

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [menuRes, ordersRes, revenueRes] = await Promise.all([
                foodAPI.getMenu(),
                foodAPI.getTodayOrders(),
                foodAPI.getTodayRevenue()
            ]);

            if (menuRes.success) setMenuItems(menuRes.data);
            if (ordersRes.success) setOrders(ordersRes.data);
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
            setMenuForm({
                item_name: '',
                category: '',
                price: 0
            });
        }
        setShowMenuModal(true);
    };

    const [cartItems, setCartItems] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentOrderNumber, setCurrentOrderNumber] = useState(null);

    // ... existing useEffects ...

    const addToCart = (item) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.id === item.id && i.plate_type === 'Full');
            if (existing) {
                return prev.map(i => i.id === item.id && i.plate_type === 'Full'
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                );
            }
            return [...prev, { ...item, quantity: 1, plate_type: 'Full', isNew: true }];
        });
        toast.success(`Added ${item.item_name}`);
    };

    const removeFromCart = async (index, item) => {
        if (!item.isNew && isEditMode) {
            if (window.confirm('Delete this item from the active order? This cannot be undone.')) {
                try {
                    await foodAPI.deleteOrderItem(item.orderItemId);
                    setCartItems(prev => prev.filter((_, i) => i !== index));
                    toast.success('Item removed from order');
                    fetchAll(); // Refresh background list
                } catch (err) {
                    toast.error('Failed to remove item');
                }
            }
            return;
        }
        setCartItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateCartItem = (index, field, value) => {
        setCartItems(prev => prev.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const cartTotal = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            let price = item.full_plate_price || item.price;
            if (item.plate_type === 'Half') {
                price = item.half_plate_price || Math.round(price * 0.6);
            }
            return sum + (price * item.quantity);
        }, 0);
    }, [cartItems]);

    // ... (filteredMenu, etc)

    const openOrderModal = async (orderToEdit = null) => {
        if (orderToEdit) {
            setIsEditMode(true);
            setCurrentOrderNumber(orderToEdit.order_number);

            // Load existing items for this order
            try {
                const res = await foodAPI.getOrderDetails(orderToEdit.order_number);
                if (res.success) {
                    const existingItems = res.data.map(o => ({
                        id: o.item_id,
                        item_name: o.food_menu?.item_name,
                        price: o.food_menu?.price, // Base price
                        full_plate_price: o.food_menu?.price,
                        quantity: o.quantity,
                        plate_type: o.plate_type,
                        isNew: false,
                        orderItemId: o.id,
                        status: o.status
                    }));
                    setCartItems(existingItems);

                    // Set form details from first item
                    if (res.data.length > 0) {
                        const first = res.data[0];
                        setOrderForm({
                            customer_name: first.customer_name,
                            table_number: first.table_number || '',
                            room_number: first.room_number || '',
                            order_type: first.order_type,
                            payment_method: first.payment_method
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to load order details');
            }
        } else {
            setIsEditMode(false);
            setCurrentOrderNumber(null);
            setCartItems([]);
            setOrderForm({
                customer_name: '',
                table_number: '',
                plate_type: 'Full', // Default
                payment_method: 'Cash',
                order_type: 'Restaurant',
                room_number: ''
            });
        }
        setShowOrderModal(true);
    };

    const handleOrderSubmit = async (e) => {
        if (e) e.preventDefault();

        if (cartItems.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        try {
            if (isEditMode) {
                // Add NEW items only
                const newItems = cartItems.filter(i => i.isNew).map(item => ({
                    item_id: item.id,
                    quantity: Number(item.quantity) || 1,
                    plate_type: item.plate_type || 'Full'
                }));

                if (newItems.length > 0) {
                    const res = await foodAPI.addItemToOrder(currentOrderNumber, newItems);
                    if (res.success) {
                        toast.success('Order updated successfully');
                        setShowOrderModal(false);
                        fetchAll();
                    }
                } else {
                    toast.info('No new items to add');
                    setShowOrderModal(false);
                }
            } else {
                // Create Batch Order
                const tableNum = orderForm.order_type === 'Restaurant' ? parseInt(orderForm.table_number) : null;
                const roomNum = orderForm.order_type === 'Room Service' ? parseInt(orderForm.room_number) : null;

                if (orderForm.order_type === 'Restaurant' && !tableNum) {
                    toast.error('Please enter a valid Table Number');
                    return;
                }
                if (orderForm.order_type === 'Room Service' && !roomNum) {
                    toast.error('Please enter a valid Room Number');
                    return;
                }

                const payload = {
                    customer_name: orderForm.customer_name,
                    order_type: orderForm.order_type,
                    payment_method: orderForm.payment_method,
                    table_number: tableNum,
                    room_number: roomNum,
                    items: cartItems.map(item => ({
                        item_id: item.id,
                        quantity: Number(item.quantity) || 1,
                        plate_type: item.plate_type || 'Full'
                    }))
                };

                const res = await foodAPI.createBatchOrder(payload);
                if (res.success) {
                    toast.success('Order placed successfully');
                    setShowOrderModal(false);
                    fetchAll();
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Failed to place order');
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const res = await foodAPI.updateOrderStatus(orderId, newStatus);
            if (res.success) {
                fetchAll();
                toast.success(`Order marked as ${newStatus}`);
            }
        } catch (err) {
            toast.error('Failed to update order status');
        }
    };

    const handleDeleteMenuItem = async (itemId) => {
        if (!window.confirm('Delete this menu item?')) return;
        try {
            const res = await foodAPI.deleteMenuItem(itemId);
            if (res.success) {
                fetchAll();
                toast.success('Menu item deleted');
            }
        } catch (err) {
            toast.error('Failed to delete menu item');
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
                        <IndianRupee className="h-8 w-8 text-blue-500 mr-3" />
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
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab
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
                            {FOOD_CATEGORIES.map(cat => (
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
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Customer</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Location</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Items Summary</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total Amount</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Time</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        // Group orders by order_number
                                        const groups = {};
                                        filteredOrders.forEach(o => {
                                            const key = o.order_number || `single_${o.id}`;
                                            if (!groups[key]) {
                                                groups[key] = { ...o, items: [], total: 0, statuses: new Set() };
                                            }
                                            groups[key].items.push(o);
                                            groups[key].total += (Number(o.total_amount) || 0);
                                            groups[key].statuses.add(o.status);
                                        });

                                        const sortedGroups = Object.values(groups).sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

                                        if (sortedGroups.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-8 text-gray-500">No orders found.</td>
                                                </tr>
                                            );
                                        }

                                        return sortedGroups.map((group) => {
                                            const isMixedStatus = group.statuses.size > 1;
                                            const displayStatus = isMixedStatus ? 'Mixed' : Array.from(group.statuses)[0];

                                            return (
                                                <tr key={group.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white font-mono text-sm">
                                                        {group.order_number || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                                                        {group.customer_name || '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                                                        {group.order_type === 'Room Service'
                                                            ? `Room ${group.room_number}`
                                                            : `Table ${group.table_number}`}
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white text-sm max-w-xs">
                                                        <div className="flex flex-col gap-1">
                                                            {group.items.slice(0, 3).map((item, idx) => (
                                                                <span key={idx} className="truncate">
                                                                    {item.quantity}x {item.food_menu?.item_name || 'Item'}
                                                                </span>
                                                            ))}
                                                            {group.items.length > 3 && (
                                                                <span className="text-xs text-gray-500">+{group.items.length - 3} more...</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white font-bold">
                                                        ₹{group.total.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
                                                            {getStatusIcon(displayStatus)}
                                                            <span className="ml-1">{displayStatus}</span>
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">
                                                        {new Date(group.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center space-x-2">
                                                            {/* Hide edit button if order is Ready or Served */}
                                                            {!group.statuses.has('Ready') && !group.statuses.has('Served') && (
                                                                <button
                                                                    onClick={() => openOrderModal(group)}
                                                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                                    title="Edit Order"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            )}

                                                            {/* Generate Bill Button - Show for Ready or Served orders */}
                                                            {(group.statuses.has('Ready') || group.statuses.has('Served')) && (
                                                                <button
                                                                    onClick={() => handleGenerateBill(group)}
                                                                    className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                                                    title="Generate Bill"
                                                                >
                                                                    <Receipt className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
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
                            {/* Group kitchen orders by order_number */}
                            {(() => {
                                const kitchenGroups = {};
                                filteredOrders.forEach(o => {
                                    const key = o.order_number || `single_${o.id}`;
                                    if (!kitchenGroups[key]) {
                                        kitchenGroups[key] = { ...o, items: [], statuses: new Set() };
                                    }
                                    kitchenGroups[key].items.push(o);
                                    kitchenGroups[key].statuses.add(o.status);
                                });

                                return Object.values(kitchenGroups).map((group) => {
                                    const allPending = Array.from(group.statuses).every(s => s === 'Pending');
                                    const allPreparing = Array.from(group.statuses).every(s => s === 'Preparing');
                                    const displayStatus = allPending ? 'Pending' : allPreparing ? 'Preparing' : 'Mixed';

                                    return (
                                        <div key={group.order_number} className={`p-4 rounded-lg border-2 ${displayStatus === 'Pending'
                                            ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                                            : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                                            }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{group.order_number}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
                                                    {displayStatus}
                                                </span>
                                            </div>
                                            {/* List all items in this order */}
                                            <div className="space-y-1 mb-2">
                                                {group.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-900 dark:text-white">{item.quantity}x {item.food_menu?.item_name}</span>
                                                        <span className={`text-xs px-1 rounded ${getStatusColor(item.status)}`}>{item.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {group.customer_name && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Customer: {group.customer_name}</p>
                                            )}
                                            {group.table_number && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Table: {group.table_number}</p>
                                            )}
                                            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                {/* Batch actions: Start Cooking All / Mark All Ready */}
                                                {allPending && (
                                                    <button
                                                        onClick={() => group.items.forEach(item => handleStatusUpdate(item.id, 'Preparing'))}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                                    >
                                                        Start Cooking All
                                                    </button>
                                                )}
                                                {allPreparing && (
                                                    <button
                                                        onClick={() => group.items.forEach(item => handleStatusUpdate(item.id, 'Ready'))}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                    >
                                                        Mark All Ready
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
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
                                    <select
                                        required
                                        value={menuForm.category}
                                        onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="">Select Category</option>
                                        {FOOD_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">

                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold dark:text-white">
                                {isEditMode ? `Edit Order #${currentOrderNumber}` : 'New Order'}
                            </h2>
                            <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Order Details Form (Top Bar) */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 grid grid-cols-1 md:grid-cols-5 gap-4">
                            <input
                                type="text"
                                placeholder="Customer Name"
                                value={orderForm.customer_name}
                                onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                                className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                disabled={isEditMode}
                            />
                            <select
                                value={orderForm.order_type}
                                onChange={(e) => setOrderForm({ ...orderForm, order_type: e.target.value })}
                                className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                disabled={isEditMode}
                            >
                                <option value="Restaurant">Restaurant</option>
                                <option value="Room Service">Room Service</option>
                            </select>

                            {orderForm.order_type === 'Restaurant' ? (
                                <input
                                    type="number"
                                    placeholder="Table No."
                                    value={orderForm.table_number}
                                    onChange={(e) => setOrderForm({ ...orderForm, table_number: e.target.value })}
                                    className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    disabled={isEditMode}
                                />
                            ) : (
                                <input
                                    type="number"
                                    placeholder="Room No."
                                    value={orderForm.room_number}
                                    onChange={(e) => setOrderForm({ ...orderForm, room_number: e.target.value })}
                                    className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                    disabled={isEditMode}
                                />
                            )}

                            <select
                                value={orderForm.payment_method}
                                onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })}
                                className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                disabled={isEditMode}
                            >
                                {paymentMethods.map(pm => (
                                    <option key={pm} value={pm}>{pm}</option>
                                ))}
                            </select>
                        </div>

                        {/* Main Content: Split View */}
                        <div className="flex-1 flex overflow-hidden">

                            {/* Left: Menu Selection */}
                            <div className="w-2/3 flex flex-col border-r border-gray-200 dark:border-gray-700">
                                {/* Filters */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto">
                                    <button
                                        onClick={() => setSelectedCategory('')}
                                        className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                    >
                                        All
                                    </button>
                                    {FOOD_CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Menu Grid */}
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredMenu.map(item => (
                                            <div key={item.id}
                                                onClick={() => addToCart(item)}
                                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-blue-500"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium dark:text-white">{item.item_name}</h4>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                                                    </div>
                                                    <span className="font-bold text-blue-600">₹{item.price}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Cart */}
                            <div className="w-1/3 flex flex-col bg-white dark:bg-gray-800">
                                <div className="p-4 border-b dark:border-gray-700">
                                    <h3 className="font-semibold flex items-center gap-2 dark:text-white">
                                        <ShoppingCart className="h-5 w-5" />
                                        Current Order
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {cartItems.length === 0 ? (
                                        <div className="text-center text-gray-400 mt-10">Cart is empty</div>
                                    ) : (
                                        cartItems.map((item, idx) => (
                                            <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${item.isNew ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-700 dark:border-gray-600'}`}>
                                                <div className="flex-1">
                                                    <p className="font-medium dark:text-white text-sm">{item.item_name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <select
                                                            value={item.plate_type}
                                                            onChange={(e) => updateCartItem(idx, 'plate_type', e.target.value)}
                                                            className="text-xs border rounded p-1 dark:bg-gray-600 dark:text-white"
                                                            disabled={!item.isNew && isEditMode}
                                                        >
                                                            <option value="Full">Full</option>
                                                            <option value="Half">Half</option>
                                                        </select>
                                                        <span className="text-xs text-gray-500">
                                                            ₹{item.plate_type === 'Half' ? (item.half_plate_price || Math.round(item.price * 0.6)) : (item.full_plate_price || item.price)}
                                                        </span>
                                                    </div>
                                                    {!item.isNew && <span className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded ml-1">Served/Prep</span>}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {item.isNew && (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateCartItem(idx, 'quantity', parseInt(e.target.value))}
                                                            className="w-12 px-1 py-1 text-center border rounded dark:bg-gray-600 dark:text-white"
                                                        />
                                                    )}
                                                    {!item.isNew && (
                                                        <span className="font-bold px-2 dark:text-white">x{item.quantity}</span>
                                                    )}

                                                    <button
                                                        onClick={() => removeFromCart(idx, item)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                    <div className="flex justify-between mb-4 text-lg font-bold dark:text-white">
                                        <span>Total</span>
                                        <span>₹{cartTotal}</span>
                                    </div>
                                    <button
                                        onClick={handleOrderSubmit}
                                        disabled={cartItems.length === 0}
                                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
                                    >
                                        {isEditMode ? 'Update Order' : 'Place Order'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {
                showOrderDetailsModal && selectedOrder && (
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Order Type</label>
                                        <p className="text-gray-900 dark:text-white">{selectedOrder.order_type || 'Restaurant'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                                        <p className="text-gray-900 dark:text-white">
                                            {selectedOrder.order_type === 'Room Service'
                                                ? `Room ${selectedOrder.room_number}`
                                                : `Table ${selectedOrder.table_number}`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plate Type</label>
                                        <p className="text-gray-900 dark:text-white">{selectedOrder.plate_type || 'Full'}</p>
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
                )
            }
        </div >
    );
};

export default FoodCourt;
