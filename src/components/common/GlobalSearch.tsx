import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '@/services/search.service';
import { useAuthStore } from '@/store/authStore';
import type { SearchResult } from '@/services/search.service';
import { Search, X, Loader2 } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      if (!user) return;

      setLoading(true);
      try {
        const searchResults = await searchService.globalSearch(user.id, query);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(searchTimeout);
  }, [query, user]);

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'purchase':
        navigate('/purchases');
        break;
      case 'product':
        navigate('/products');
        break;
      case 'bundle':
        navigate('/bundles');
        break;
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-4 md:pt-[10vh] bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Box */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden transition-colors duration-200">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 md:px-6 py-4 md:py-5 border-b border-neutral-200 dark:border-neutral-700">
            {loading ? (
              <Loader2 size={24} className="text-primary-500 dark:text-primary-400 animate-spin" />
            ) : (
              <Search size={24} className="text-neutral-400 dark:text-neutral-500" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar compras, productos, listas..."
              className="flex-1 text-lg font-medium outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 bg-transparent text-neutral-900 dark:text-neutral-100"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            >
              <X size={20} className="text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[70vh] md:max-h-[60vh] overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-6 py-12 text-center">
                <Search size={48} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                  Escribe al menos 2 caracteres para buscar
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
                  Busca en compras, productos y listas
                </p>
              </div>
            ) : loading ? (
              <div className="px-6 py-12 text-center">
                <Loader2 size={48} className="mx-auto mb-4 text-primary-500 dark:text-primary-400 animate-spin" />
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">Buscando...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-neutral-600 dark:text-neutral-300 font-bold text-lg mb-2">
                  No se encontraron resultados
                </p>
                <p className="text-neutral-400 dark:text-neutral-500">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-6 py-4 flex items-center gap-4 transition-all ${
                      index === selectedIndex
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 dark:border-primary-400'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="text-3xl">{result.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                        {result.title}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {result.subtitle}
                      </p>
                    </div>
                    {index === selectedIndex && (
                      <kbd className="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 rounded text-xs font-mono">
                        ↵
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint - Hidden on mobile (keyboard shortcuts not relevant for touch) */}
          {results.length > 0 && (
            <div className="px-4 md:px-6 py-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <div className="hidden md:flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">↑</kbd>
                  <kbd className="px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">↵</kbd>
                  seleccionar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600 font-mono">esc</kbd>
                  cerrar
                </span>
              </div>
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                {results.length} resultado{results.length !== 1 && 's'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
