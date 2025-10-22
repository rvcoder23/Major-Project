import React from 'react';
import { Users, Plus, Search, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Housekeeping = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Housekeeping Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage cleaning tasks and staff assignments
                    </p>
                </div>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" />
                    Assign Task
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Tasks</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Today</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                        <AlertCircle className="h-8 w-8 text-red-500 mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Housekeeping Management Module
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        This module will include task assignment, cleaning reports, and staff management functionality.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Housekeeping;
