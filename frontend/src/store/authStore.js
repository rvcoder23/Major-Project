import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

const useAuthStore = create(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,

            login: async (username, password) => {
                try {
                    const response = await api.post('/auth/login', { username, password });

                    if (response.data.success) {
                        set({
                            isAuthenticated: true,
                            user: response.data.user
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Login failed:', error);
                    return false;
                }
            },

            logout: () => {
                set({ isAuthenticated: false, user: null });
            },

            changePassword: async (currentPassword, newPassword) => {
                try {
                    const currentUser = get().user;
                    if (!currentUser) return false;

                    const response = await api.post('/auth/change-password', {
                        username: currentUser.username,
                        currentPassword,
                        newPassword
                    });

                    return response.data.success;
                } catch (error) {
                    console.error('Change password failed:', error);
                    return false;
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user
            }),
        }
    )
);

export { useAuthStore };
