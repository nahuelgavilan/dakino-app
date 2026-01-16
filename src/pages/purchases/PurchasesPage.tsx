import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseService } from '@/services/purchase.service';
import { categoryService } from '@/services/category.service';
import { tagService } from '@/services/tag.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Purchase, Category, Tag } from '@/types/models';
import { Spinner } from '@/components/common/Spinner';
import { TagBadge } from '@/components/tags/TagBadge';
import { Plus, Search, Filter, Calendar, DollarSign, Download, X, Edit2 } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportToCSV, exportToJSON } from '@/utils/export';

export const PurchasesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success } = useToast();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [purchasesData, categoriesData, tagsData] = await Promise.all([
        purchaseService.getAllPurchases(user.id),
        categoryService.getCategories(user.id),
        tagService.getTags(user.id),
      ]);
      setPurchases(purchasesData);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    // Search filter
    const matchesSearch = purchase.product_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Category filter (multiple)
    const matchesCategory =
      selectedCategories.length === 0 ||
      (purchase.category_id && selectedCategories.includes(purchase.category_id));

    // Tags filter (multiple) - purchase must have ALL selected tags
    const matchesTags =
      selectedTags.length === 0 ||
      (purchase.tags &&
        selectedTags.every((tagId) =>
          purchase.tags!.some((pt) => pt.tag_id === tagId)
        ));

    // Date range filter
    const purchaseDate = new Date(purchase.purchase_date);
    const matchesStartDate =
      !startDate || purchaseDate >= new Date(startDate);
    const matchesEndDate =
      !endDate || purchaseDate <= new Date(endDate);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesTags &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  const totalSpent = filteredPurchases.reduce(
    (sum, p) => sum + p.total_price,
    0
  );

  const handleExport = (format: 'csv' | 'json') => {
    if (filteredPurchases.length === 0) {
      return;
    }

    const filename = 'dakino-compras';

    if (format === 'csv') {
      exportToCSV(filteredPurchases, filename);
    } else {
      exportToJSON(filteredPurchases, filename);
    }

    success(`Datos exportados en formato ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTags.length > 0 ||
    startDate ||
    endDate ||
    searchQuery;

  const categoryColors: Record<string, string> = {
    'Alimentos': 'from-green-400 to-emerald-500',
    'Limpieza': 'from-blue-400 to-cyan-500',
    'Salud': 'from-red-400 to-pink-500',
    'Hogar': 'from-orange-400 to-amber-500',
    'Ropa': 'from-purple-400 to-violet-500',
    'Entretenimiento': 'from-yellow-400 to-orange-500',
    'Transporte': 'from-indigo-400 to-blue-500',
    'Tecnología': 'from-gray-400 to-slate-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-neutral-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-neutral-900">
              Mis Compras
            </h1>

            <div className="flex gap-2">
              {/* Export Button */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={filteredPurchases.length === 0}
                  className="bg-white border-2 border-primary-500 text-primary-500 p-3 rounded-2xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={20} />
                </button>

                {/* Export Menu */}
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border-2 border-neutral-100 overflow-hidden z-20 min-w-[160px]">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors font-semibold text-neutral-700"
                    >
                      📊 Exportar CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors font-semibold text-neutral-700 border-t border-neutral-100"
                    >
                      📄 Exportar JSON
                    </button>
                  </div>
                )}
              </div>

              {/* Add Button */}
              <button
                onClick={() => navigate('/purchases/new')}
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-3 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar compras..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-2xl focus:border-primary-500 focus:outline-none transition-colors"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
                showFilters ? 'bg-primary-100 text-primary-600' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 bg-white rounded-2xl p-5 shadow-lg space-y-5">
              {/* Date Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-neutral-700">
                    Rango de fechas
                  </p>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-neutral-700">
                    Categorías ({selectedCategories.length})
                  </p>
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        selectedCategories.includes(category.id)
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-neutral-700">
                      Etiquetas ({selectedTags.length})
                    </p>
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full font-bold text-sm transition-all ${
                          selectedTags.includes(tag.id)
                            ? 'scale-105 shadow-md'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: selectedTags.includes(tag.id)
                            ? tag.color
                            : tag.color + '20',
                          color: selectedTags.includes(tag.id)
                            ? 'white'
                            : tag.color,
                          border: `2px solid ${tag.color}`,
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear All Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  <X size={18} />
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-6 shadow-xl text-white mb-6">
          <p className="text-sm font-medium opacity-90 mb-1">Total gastado</p>
          <p className="text-5xl font-black">${totalSpent.toFixed(2)}</p>
          <p className="text-sm opacity-80 mt-2">
            {filteredPurchases.length} {filteredPurchases.length === 1 ? 'compra' : 'compras'}
            {hasActiveFilters && ' con filtros aplicados'}
          </p>
        </div>

        {/* Purchases List */}
        <div className="space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-xl font-bold text-neutral-600 mb-2">
                No hay compras
              </p>
              <p className="text-neutral-400">
                {hasActiveFilters
                  ? 'Intenta con otros filtros'
                  : 'Agrega tu primera compra para comenzar'}
              </p>
            </div>
          ) : (
            filteredPurchases.map((purchase, index) => {
              const gradient = categoryColors[purchase.category?.name || ''] || 'from-gray-400 to-gray-500';

              return (
                <div
                  key={purchase.id}
                  className="group bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  {/* Category gradient bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${gradient}`}
                  />

                  {/* Edit Button (appears on hover) */}
                  <button
                    onClick={() => navigate(`/purchases/${purchase.id}`)}
                    className="absolute top-4 right-4 p-2 bg-white dark:bg-neutral-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                    title="Editar compra"
                  >
                    <Edit2 size={18} className="text-primary-500 dark:text-primary-400" />
                  </button>

                  <div className="pl-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-xl text-neutral-900 dark:text-neutral-100 mb-1">
                          {purchase.product_name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                          {purchase.category && (
                            <>
                              <span className="font-semibold">{purchase.category.name}</span>
                              <span>•</span>
                            </>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDistance(
                              new Date(purchase.purchase_date),
                              new Date(),
                              { addSuffix: true, locale: es }
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                            {purchase.unit_type === 'unit' ? '📦' : '⚖️'}
                            <span className="font-medium">
                              {purchase.quantity}{' '}
                              {purchase.unit_type === 'unit' ? 'unidades' : 'kg'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                            <DollarSign size={14} />
                            <span className="font-medium">
                              ${purchase.unit_price?.toFixed(2)}/
                              {purchase.unit_type === 'unit' ? 'u' : 'kg'}
                            </span>
                          </div>
                        </div>

                        {purchase.tags && purchase.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {purchase.tags.map((pt) => pt.tag && (
                              <TagBadge key={pt.tag_id} tag={pt.tag} size="sm" />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black text-primary-500 dark:text-primary-400">
                          ${purchase.total_price.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {purchase.notes && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 italic">
                          "{purchase.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-primary-500 to-secondary-500 pointer-events-none" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
