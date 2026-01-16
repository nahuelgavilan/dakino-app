import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import { useCommandK } from '@/hooks/useKeyboardShortcut';
import { Search } from 'lucide-react';

export const AppLayout = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useCommandK(() => setIsSearchOpen(true));

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Global Search Button (Floating) */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="fixed top-4 right-4 z-40 bg-white border-2 border-neutral-200 text-neutral-700 p-3 rounded-2xl shadow-lg hover:shadow-xl hover:border-primary-500 active:scale-95 transition-all duration-200 group"
        title="Buscar (⌘K)"
      >
        <Search size={20} className="group-hover:text-primary-500 transition-colors" />
      </button>

      <main className="pb-24">
        <Outlet />
      </main>

      <BottomNav />

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
