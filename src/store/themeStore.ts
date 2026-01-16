import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          updateDOMTheme(newTheme);
          return { theme: newTheme };
        }),
      setTheme: (theme: Theme) => {
        updateDOMTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'dakino-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme to DOM when hydrating from storage
        if (state) {
          updateDOMTheme(state.theme);
        }
      },
    }
  )
);

function updateDOMTheme(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

// Initialize theme on load
const initialTheme = useThemeStore.getState().theme;
updateDOMTheme(initialTheme);
