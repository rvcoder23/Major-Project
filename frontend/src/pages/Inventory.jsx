import React, { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';
import { inventoryAPI } from '../services/api';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [purchases, setPurchases] = useState([]);

    const [form, setForm] = useState({
        item_name: '',
        quantity: 0,
        threshold: 0,
        price: 0
    });

    const [stockForm, setStockForm] = useState({
        quantity: 1,
        total_cost: 0
    });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [invRes, purRes] = await Promise.all([
                inventoryAPI.getAll(),
                inventoryAPI.getPurchases()
            ]);
            if (invRes.success) setItems(invRes.data);
            if (purRes.success) setPurchases(purRes.data);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalItems = items.length;
    const lowStockCount = useMemo(() => items.filter(i => Number(i.quantity) <= Number(i.threshold)).length, [items]);
    const thisMonthSpend = useMemo(() => {
        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();
        const monthlyPurchases = purchases
            .filter(p => {
                const d = new Date(p.purchase_date || p.created_at || new Date());
                return d.getMonth() === m && d.getFullYear() === y;
            })
            .reduce((sum, p) => sum + Number(p.total_cost || 0), 0);

        // Avoid double counting: only add inventory rows that have a last_refilled this month
        // AND do not have a purchase record this month for that item
        const purchasedItemIds = new Set(
            purchases
                .filter(p => {
                    const d = new Date(p.purchase_date || p.created_at || new Date());
                    return d.getMonth() === m && d.getFullYear() === y;
                })
                .map(p => p.item_id)
        );

        const inventoryValueThisMonth = items
            .filter(it => {
                if (!it.last_refilled) return false;
                const d = new Date(it.last_refilled);
                return d.getMonth() === m && d.getFullYear() === y && !purchasedItemIds.has(it.id);
            })
            .reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);

        const total = monthlyPurchases + inventoryValueThisMonth;
        return Number(total.toFixed(2));
    }, [purchases, items]);

    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return items.filter(i => i.item_name?.toLowerCase().includes(term));
    }, [items, searchTerm]);

    const openAdd = () => {
        setForm({ item_name: '', quantity: 0, threshold: 0, price: 0 });
        setShowAddModal(true);
    };

    const openEdit = (item) => {
        setSelectedItem(item);
        setForm({
            item_name: item.item_name || '',
            quantity: Number(item.quantity) || 0,
            threshold: Number(item.threshold) || 0,
            price: Number(item.price) || 0
        });
        setShowEditModal(true);
    };

    const openStock = (item) => {
        setSelectedItem(item);
        const initialTotal = Number(item.price || 0) * 1;
        setStockForm({ quantity: 1, total_cost: initialTotal });
        setShowStockModal(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                item_name: form.item_name.trim(),
                quantity: Number(form.quantity),
                threshold: Number(form.threshold),
                price: Number(form.price)
            };
            const res = await inventoryAPI.create(payload);
            if (res.success) {
                setShowAddModal(false);
                fetchAll();
            }
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to add item');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                item_name: form.item_name.trim(),
                quantity: Number(form.quantity),
                threshold: Number(form.threshold),
                price: Number(form.price)
            };
            const res = await inventoryAPI.update(selectedItem.id, payload);
            if (res.success) {
                setShowEditModal(false);
                fetchAll();
            }
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to update item');
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete ${item.item_name}?`)) return;
        try {
            const res = await inventoryAPI.delete(item.id);
            if (res.success) fetchAll();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        try {
            const res = await inventoryAPI.addStock(selectedItem.id, {
                quantity: Number(stockForm.quantity),
                total_cost: Number(stockForm.total_cost)
            });
            if (res.success) {
                setShowStockModal(false);
                fetchAll();
            }
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to add stock');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Inventory Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage hotel inventory, stock levels, and purchases
                    </p>
                </div>
                <button onClick={openAdd} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Item
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{lowStockCount}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month Purchases</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{thisMonthSpend}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading inventory...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Item</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Quantity</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Threshold</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Price (₹)</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Refilled</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(item => {
                                    const isLow = Number(item.quantity) <= Number(item.threshold);
                                    return (
                                        <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-700 ${isLow ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                            <td className="py-3 px-4">
                                                <span className="text-gray-900 dark:text-white font-medium">{item.item_name}</span>
                                                {isLow && (
                                                    <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">Low</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{item.quantity}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{item.threshold}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{Number(item.price || 0)}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white">{item.last_refilled ? new Date(item.last_refilled).toLocaleDateString('en-US') : '-'}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openStock(item)} className="px-2 py-1 text-white bg-green-600 hover:bg-green-700 rounded">Add Stock</button>
                                                    <button onClick={() => openEdit(item)} className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" title="Edit">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Delete">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center py-8 text-gray-600 dark:text-gray-400">No items found.</div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Item</h2>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
                                    <input type="text" required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                                    <input type="number" min="0" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low-stock Threshold</label>
                                    <input type="number" min="0" required value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                    <input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Item</h2>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
                                    <input type="text" required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                                    <input type="number" min="0" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low-stock Threshold</label>
                                    <input type="number" min="0" required value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                    <input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Stock Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Add Stock</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Item: {selectedItem?.item_name}</p>
                        <form onSubmit={handleAddStock}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                                    <input type="number" min="1" required value={stockForm.quantity} onChange={(e) => {
                                        const q = Number(e.target.value || 1);
                                        const unit = Number(selectedItem?.price || 0);
                                        setStockForm({ quantity: q, total_cost: Number((q * unit).toFixed(2)) });
                                    }} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Cost (₹)</label>
                                    <input type="number" min="0" step="0.01" required value={stockForm.total_cost} onChange={(e) => setStockForm({ ...stockForm, total_cost: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setShowStockModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
