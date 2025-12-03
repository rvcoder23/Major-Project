import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Search, Filter, TrendingUp, TrendingDown, PieChart, Edit, Trash2, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { accountsAPI, bookingsAPI } from '../services/api';

const Accounts = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0,
        transactions: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [transactionForm, setTransactionForm] = useState({
        description: '',
        amount: '',
        type: 'Income',
        payment_method: 'Cash'
    });
    const [paymentMethods, setPaymentMethods] = useState(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer']);

    useEffect(() => {
        fetchData();
        fetchPaymentMethods();
    }, []);

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

    const fetchData = async () => {
        try {
            setLoading(true);
            const [transactionsRes, summaryRes] = await Promise.all([
                accountsAPI.getAll(),
                accountsAPI.getDailySummary()
            ]);
            
            if (transactionsRes.success) setTransactions(transactionsRes.data);
            if (summaryRes.success) setSummary(summaryRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = !filterType || transaction.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const openTransactionModal = (transaction = null) => {
        if (transaction) {
            setEditingTransaction(transaction);
            setTransactionForm({
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type,
                payment_method: transaction.payment_method || 'Cash'
            });
        } else {
            setEditingTransaction(null);
            setTransactionForm({
                description: '',
                amount: '',
                type: 'Income',
                payment_method: 'Cash'
            });
        }
        setShowTransactionModal(true);
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                description: transactionForm.description.trim(),
                amount: Number(transactionForm.amount),
                type: transactionForm.type,
                payment_method: transactionForm.payment_method || 'Cash'
            };
            
            if (editingTransaction) {
                // Update existing transaction
                const res = await accountsAPI.update(editingTransaction.id, payload);
                if (res.success) {
                    setShowTransactionModal(false);
                    fetchData();
                }
            } else {
                // Create new transaction
                const res = await accountsAPI.create(payload);
                if (res.success) {
                    setShowTransactionModal(false);
                    fetchData();
                }
            }
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to save transaction');
        }
    };

    const handleDeleteTransaction = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        try {
            const res = await accountsAPI.delete(id);
            if (res.success) fetchData();
        } catch (err) {
            alert('Failed to delete transaction');
        }
    };

    const getTypeColor = (type) => {
        return type === 'Income' 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400';
    };

    const getTypeIcon = (type) => {
        return type === 'Income' 
            ? <ArrowUpRight className="h-4 w-4" />
            : <ArrowDownLeft className="h-4 w-4" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Accounts & Finance
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage financial transactions, expenses, and revenue tracking
                    </p>
                </div>
                <button 
                    onClick={() => openTransactionModal()}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Transaction
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalIncome.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{summary.totalExpense.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <IndianRupee className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
                            <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ₹{summary.netProfit.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <PieChart className="h-8 w-8 text-purple-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.transactions}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Types</option>
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
                </div>
                
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transactions...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <IndianRupee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Transactions</h3>
                        <p className="text-gray-600 dark:text-gray-400">Start by adding your first transaction.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Type</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Description</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Amount</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Date</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="py-4 px-6">
                                            <div className={`flex items-center ${getTypeColor(transaction.type)}`}>
                                                {getTypeIcon(transaction.type)}
                                                <span className="ml-2 font-medium">{transaction.type}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-900 dark:text-white">{transaction.description}</td>
                                        <td className={`py-4 px-6 font-semibold ${getTypeColor(transaction.type)}`}>
                                            {transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400">
                                            {new Date(transaction.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => openTransactionModal(transaction)}
                                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            {showTransactionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
                        </h2>
                        <form onSubmit={handleTransactionSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select
                                        required
                                        value={transactionForm.type}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="Income">Income</option>
                                        <option value="Expense">Expense</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <input
                                        type="text"
                                        required
                                        value={transactionForm.description}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="Enter transaction description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={transactionForm.amount}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="Enter amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                                    <select
                                        required
                                        value={transactionForm.payment_method}
                                        onChange={(e) => setTransactionForm({ ...transactionForm, payment_method: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    >
                                        {paymentMethods.map(method => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowTransactionModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingTransaction ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
