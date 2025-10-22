import React from 'react';
import { Utensils, Plus, Search, Filter, ShoppingCart, Receipt, ChefHat } from 'lucide-react';

const FoodCourt = () => {
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
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" />
                    New Order
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Utensils className="h-8 w-8 text-orange-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Menu Items</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">28</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <ShoppingCart className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Orders</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">45</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Receipt className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹12,500</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <ChefHat className="h-8 w-8 text-purple-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Staff</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-12">
                    <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Food Court & POS Module
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        This module will include menu management, order processing, POS system, and kitchen operations functionality.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FoodCourt;
