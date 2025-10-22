import React from 'react';
import { Package, Plus, Search, Filter, Edit, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';

const Inventory = () => {
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
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Item
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">45</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹25,000</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Package className="h-8 w-8 text-purple-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suppliers</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Inventory Management Module
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        This module will include stock management, purchase tracking, and supplier management functionality.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Inventory;
