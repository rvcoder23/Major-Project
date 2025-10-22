import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,

            login: (username, password) => {
                // Local authentication - no database check
                if (username === 'admin' && password === 'admin123') {
                    set({
                        isAuthenticated: true,
                        user: { username: 'admin', role: 'admin' }
                    });
                    return true;
                }
                return false;
            },

            logout: () => {
                set({ isAuthenticated: false, user: null });
            },

            changePassword: (newPassword) => {
                // Password change logic - stored in localStorage
                const currentUser = get().user;
                if (currentUser) {
                    // In a real app, you'd hash this password
                    localStorage.setItem('admin_password', newPassword);
                    return true;
                }
                return false;
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
