import React from 'react';
import { BarChart3, Download, Filter, Calendar, FileText, PieChart } from 'lucide-react';

const Reports = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Generate comprehensive reports and view analytics
                    </p>
                </div>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Download className="h-5 w-5 mr-2" />
                    Export Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <FileText className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Report</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Available</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <BarChart3 className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Weekly Report</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Available</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <PieChart className="h-8 w-8 text-purple-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Report</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Available</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-orange-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custom Report</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Available</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Reports & Analytics Module
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        This module will include comprehensive reporting, analytics dashboard, and data export functionality.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Reports;
