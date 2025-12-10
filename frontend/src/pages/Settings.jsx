import React, { useState } from 'react';
import { Lock, User, Hotel, Bell, Palette, Save, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [hotelInfo, setHotelInfo] = useState({
        name: 'Grand Hotel',
        address: '123 Main Street, City, State',
        phone: '+91 9876543210',
        email: 'info@grandhotel.com'
    });

    // Notification Settings State
    const [notificationSettings, setNotificationSettings] = useState({
        email_notifications: true,
        low_stock_alerts: true,
        booking_notifications: true
    });

    const { changePassword } = useAuthStore();
    const { isDarkMode, toggleTheme } = useThemeStore();

    // Fetch settings on load
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await settingsAPI.getNotifications();
                if (res.success) {
                    setNotificationSettings(res.data);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
                // Don't toast on load error to avoid annoyance if API fails silently
            }
        };
        fetchSettings();
    }, []);

    const handleNotificationChange = (key, value) => {
        setNotificationSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const saveNotificationSettings = async () => {
        try {
            const res = await settingsAPI.updateNotifications(notificationSettings);
            if (res.success) {
                toast.success('Notification preferences saved');
            } else {
                toast.error('Failed to save preferences');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Error saving preferences');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        const success = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
        if (success) {
            toast.success('Password changed successfully');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } else {
            toast.error('Failed to change password');
        }
    };

    const handleHotelInfoSave = (e) => {
        e.preventDefault();
        toast.success('Hotel information updated successfully');
    };

    const tabs = [
        { id: 'profile', name: 'Profile', icon: User },
        { id: 'security', name: 'Security', icon: Lock },
        { id: 'hotel', name: 'Hotel Info', icon: Hotel },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'appearance', name: 'Appearance', icon: Palette }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row">
                    {/* Sidebar */}
                    <div className="lg:w-64 border-r border-gray-200 dark:border-gray-700">
                        <nav className="p-4 space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    <tab.icon className="h-5 w-5 mr-3" />
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Profile Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value="admin"
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Role
                                        </label>
                                        <input
                                            type="text"
                                            value="Administrator"
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Change Password
                                </h3>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                required
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                required
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-10"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Save className="h-5 w-5 mr-2" />
                                        Change Password
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'hotel' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Hotel Information
                                </h3>
                                <form onSubmit={handleHotelInfoSave} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Hotel Name
                                        </label>
                                        <input
                                            type="text"
                                            value={hotelInfo.name}
                                            onChange={(e) => setHotelInfo({ ...hotelInfo, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Address
                                        </label>
                                        <textarea
                                            value={hotelInfo.address}
                                            onChange={(e) => setHotelInfo({ ...hotelInfo, address: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={hotelInfo.phone}
                                            onChange={(e) => setHotelInfo({ ...hotelInfo, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={hotelInfo.email}
                                            onChange={(e) => setHotelInfo({ ...hotelInfo, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Save className="h-5 w-5 mr-2" />
                                        Save Changes
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Notification Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Email Notifications
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Receive email notifications for important updates
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.email_notifications}
                                            onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Low Stock Alerts
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Get notified when inventory items are running low
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.low_stock_alerts}
                                            onChange={(e) => handleNotificationChange('low_stock_alerts', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Booking Notifications
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Receive notifications for new bookings and cancellations
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.booking_notifications}
                                            onChange={(e) => handleNotificationChange('booking_notifications', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            onClick={saveNotificationSettings}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Appearance Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Dark Mode
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Switch between light and dark themes
                                            </p>
                                        </div>
                                        <button
                                            onClick={toggleTheme}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
