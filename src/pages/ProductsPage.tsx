import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Product, Category } from '@/types/models';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { Spinner } from '@/components/common/Spinner';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  ShoppingCart,
  MoreVertical,
  X
} from 'lucide-react';
import { ROUTES } from '@/router/routes';

export const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(user.id),
        categoryService.getCategories(user.id),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading products:', error);
      showError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto de tu catálogo?')) return;

    try {
      await productService.deleteProduct(id);
      showSuccess('Producto eliminado');
      await loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      showError('Error al eliminar producto');
    }
  };

  const handleBuyProduct = (product: Product) => {
    // Navigate to purchase form with product pre-selected
    navigate(ROUTES.APP.PURCHASES_NEW, { state: { product } });
  };

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group products by category for display
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Sin categoría';
    if (!acc[categoryName]) {
      acc[categoryName] = {
        category: product.category,
        products: [],
      };
    }
    acc[categoryName].products.push(product);
    return acc;
  }, {} as Record<string, { category: Category | undefined; products: Product[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                Mi Catálogo
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {products.length} productos guardados
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="w-12 h-12 bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 active:scale-95 transition-transform"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en tu catálogo..."
              className="w-full pl-12 pr-10 py-3 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              selectedCategory === null
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-1.5 ${
                selectedCategory === category.id
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={40} className="text-neutral-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {searchQuery || selectedCategory ? 'No hay resultados' : 'Tu catálogo está vacío'}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
              {searchQuery || selectedCategory
                ? 'Intenta con otro término o categoría'
                : 'Añade productos que compras frecuentemente para registrar compras más rápido'}
            </p>
            {!searchQuery && !selectedCategory && (
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
              >
                <Plus size={20} />
                Crear mi primer producto
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(productsByCategory).map(([categoryName, { category, products: categoryProducts }]) => (
              <div key={categoryName}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{category?.icon || '📦'}</span>
                  <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                    {categoryName}
                  </h2>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    ({categoryProducts.length})
                  </span>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm relative group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Product Image/Icon */}
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ backgroundColor: (category?.color || '#6366F1') + '20' }}
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            category?.icon || '📦'
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-400">
                              {product.unit_type === 'unit' ? '📦 Unidad' : '⚖️ Peso'}
                            </span>
                            {product.usage_count > 0 && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {product.usage_count} {product.usage_count === 1 ? 'compra' : 'compras'}
                              </span>
                            )}
                          </div>
                          {product.default_price && (
                            <p className="text-primary-500 font-bold mt-1">
                              ${product.default_price.toFixed(2)}
                              {product.unit_type === 'weight' && product.default_unit && (
                                <span className="text-neutral-500 font-normal text-sm">/{product.default_unit}</span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Quick Buy Button */}
                        <button
                          onClick={() => handleBuyProduct(product)}
                          className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
                          title="Registrar compra"
                        >
                          <ShoppingCart size={18} />
                        </button>

                        {/* Menu Button */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === product.id ? null : product.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                          >
                            <MoreVertical size={18} className="text-neutral-400" />
                          </button>

                          {/* Dropdown Menu */}
                          {menuOpen === product.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuOpen(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-700 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-600 py-1 z-50 min-w-[140px]">
                                <button
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsModalOpen(true);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-600 text-left transition-colors"
                                >
                                  <Edit2 size={16} className="text-neutral-500" />
                                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Editar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleDelete(product.id);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors"
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Eliminar</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={loadData}
        product={selectedProduct}
      />
    </div>
  );
};
