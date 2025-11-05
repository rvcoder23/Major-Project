import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import {
    Home,
    Bed,
    Calendar,
    Users,
    Package,
    Utensils,
    IndianRupee,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    User
} from 'lucide-react';
import { cn } from '../utils/helpers';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logout, user } = useAuthStore();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Rooms', href: '/rooms', icon: Bed },
        { name: 'Bookings', href: '/bookings', icon: Calendar },
        { name: 'Housekeeping', href: '/housekeeping', icon: Users },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Food Court', href: '/food-court', icon: Utensils },
        { name: 'Accounts', href: '/accounts', icon: IndianRupee },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className={cn('min-h-screen', isDarkMode ? 'dark' : '')}>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                {/* Sidebar */}
                <div className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}>
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">FOM</span>
                            </div>
                            <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                                Front Office Management
                            </span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="mt-6 px-3">
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={cn(
                                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                            isActive
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                                        )}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon
                                            className={cn(
                                                'mr-3 h-5 w-5 flex-shrink-0',
                                                isActive
                                                    ? 'text-blue-500 dark:text-blue-400'
                                                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                                            )}
                                        />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user?.username}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Administrator
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                    {/* Top navigation */}
                    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {isDarkMode ? (
                                        <Sun className="h-5 w-5" />
                                    ) : (
                                        <Moon className="h-5 w-5" />
                                    )}
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white rounded-md"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;
