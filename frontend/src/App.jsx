import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import Housekeeping from './pages/Housekeeping';
import Inventory from './pages/Inventory';
import FoodCourt from './pages/FoodCourt';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function App() {
    const { isAuthenticated } = useAuthStore();

    return (
        <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Toaster position="top-right" />

                {!isAuthenticated ? (
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                ) : (
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/rooms" element={<Rooms />} />
                            <Route path="/bookings" element={<Bookings />} />
                            <Route path="/housekeeping" element={<Housekeeping />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/food-court" element={<FoodCourt />} />
                            <Route path="/accounts" element={<Accounts />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Layout>
                )}
            </div>
        </Router>
    );
}

export default App;
