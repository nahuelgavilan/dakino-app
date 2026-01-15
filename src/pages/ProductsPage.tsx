import { useEffect, useState } from 'react';
import { productService } from '@/services/product.service';
import { useAuthStore } from '@/store/authStore';
import { Product } from '@/types/models';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Search, Package, Star, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProductsPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [allProducts, frequent] = await Promise.all([
        productService.getProducts(user.id),
        productService.getFrequentProducts(user.id, 5),
      ]);
      setProducts(allProducts);
      setFrequentProducts(frequent);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;

    try {
      await productService.deleteProduct(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-accent-50/20 to-primary-50/20 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-neutral-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black text-neutral-900">
              Mis Productos
            </h1>

            <button
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-accent-500 to-accent-600 text-white p-3 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
            >
              <Plus size={20} />
            </button>
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
              placeholder="Buscar productos..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-2xl focus:border-accent-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Frequent Products */}
        {frequentProducts.length > 0 && !searchQuery && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="text-accent-500" fill="currentColor" />
              <h2 className="text-xl font-black text-neutral-900">
                Productos Frecuentes
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {frequentProducts.map((product) => {
                const gradient = categoryColors[product.category?.name || ''] || 'from-gray-400 to-gray-500';

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden"
                  >
                    {/* Gradient accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient}`} />

                    <div className="pl-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-lg text-neutral-900">
                            {product.name}
                          </h3>
                          <span className="text-sm px-2 py-0.5 bg-accent-100 text-accent-700 rounded-lg font-semibold">
                            {product.unit_type === 'unit' ? '📦 Unidad' : '⚖️ Peso'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-neutral-500">
                          {product.category && (
                            <span className="font-semibold">
                              {product.category.icon} {product.category.name}
                            </span>
                          )}
                          {product.usage_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <TrendingUp size={14} />
                                {product.usage_count} {product.usage_count === 1 ? 'uso' : 'usos'}
                              </span>
                            </>
                          )}
                        </div>

                        {product.default_price && (
                          <div className="mt-2 text-primary-500 font-black text-lg">
                            ${product.default_price.toFixed(2)}
                            {product.unit_type === 'weight' && product.default_unit && ` / ${product.default_unit}`}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                        >
                          <Edit2 size={18} className="text-neutral-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Products */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package size={20} className="text-neutral-600" />
            <h2 className="text-xl font-black text-neutral-900">
              {searchQuery ? 'Resultados' : 'Todos los Productos'}
            </h2>
            <span className="text-sm text-neutral-500 font-semibold">
              ({filteredProducts.length})
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl font-bold text-neutral-600 mb-2">
                {searchQuery ? 'No se encontraron productos' : 'No hay productos'}
              </p>
              <p className="text-neutral-400 mb-6">
                {searchQuery
                  ? 'Intenta con otro término de búsqueda'
                  : 'Crea tu primer producto para comenzar'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  <Plus size={20} />
                  Crear Producto
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredProducts.map((product, index) => {
                const gradient = categoryColors[product.category?.name || ''] || 'from-gray-400 to-gray-500';

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden group"
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    {/* Gradient accent */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient}`} />

                    <div className="pl-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-lg text-neutral-900 truncate">
                            {product.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-lg font-semibold whitespace-nowrap">
                            {product.unit_type === 'unit' ? '📦' : '⚖️'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 mb-2">
                          {product.category && (
                            <span className="font-semibold">
                              {product.category.icon} {product.category.name}
                            </span>
                          )}
                          {product.usage_count > 0 && (
                            <>
                              <span>•</span>
                              <span>{product.usage_count} {product.usage_count === 1 ? 'uso' : 'usos'}</span>
                            </>
                          )}
                          {product.last_used_at && (
                            <>
                              <span>•</span>
                              <span>
                                Último uso{' '}
                                {formatDistance(new Date(product.last_used_at), new Date(), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </span>
                            </>
                          )}
                        </div>

                        {product.default_price && (
                          <div className="text-primary-500 font-black text-lg">
                            ${product.default_price.toFixed(2)}
                            {product.unit_type === 'weight' && product.default_unit && (
                              <span className="text-sm text-neutral-500 font-medium ml-1">
                                / {product.default_unit}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                        >
                          <Edit2 size={18} className="text-neutral-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-accent-500 to-primary-500 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
