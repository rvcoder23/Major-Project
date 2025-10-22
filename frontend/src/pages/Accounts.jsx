import React from 'react';
import { DollarSign, Plus, Search, Filter, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

const Accounts = () => {
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
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Transaction
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹1,25,000</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <TrendingDown className="h-8 w-8 text-red-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹45,000</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <DollarSign className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹80,000</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <PieChart className="h-8 w-8 text-purple-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Accounts & Finance Module
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        This module will include transaction management, financial reporting, and accounting functionality.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Accounts;
