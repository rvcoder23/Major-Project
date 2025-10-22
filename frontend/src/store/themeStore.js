import { create } from 'zustand';

const useThemeStore = create((set) => ({
    isDarkMode: false,

    toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

    setTheme: (isDark) => set({ isDarkMode: isDark }),
}));

export { useThemeStore };
