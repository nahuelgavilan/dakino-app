import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useCommandK } from '@/hooks/useKeyboardShortcut';
import { Search } from 'lucide-react';

export const AppLayout = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useCommandK(() => setIsSearchOpen(true));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200">
      {/* Floating Actions */}
      <div className="fixed top-4 right-4 z-40 flex gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Global Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 p-3 rounded-2xl shadow-lg hover:shadow-xl hover:border-primary-500 dark:hover:border-primary-400 active:scale-95 transition-all duration-200 group"
          title="Buscar (⌘K)"
        >
          <Search size={20} className="group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
        </button>
      </div>

      <main className="pb-24">
        <Outlet />
      </main>

      <BottomNav />

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
