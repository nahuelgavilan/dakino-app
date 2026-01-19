import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import { bundleService } from '@/services/bundle.service';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { inventoryService } from '@/services/inventory.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { BundleInsert, BundleItemInsert, Product, Category, InventoryItem } from '@/types/models';
import { X, Plus, Trash2, Package, Search, Check, ChevronRight, AlertCircle } from 'lucide-react';

const BUNDLE_ICONS = ['🛒', '📦', '🏪', '🍎', '🧹', '🏠', '💊', '🎮', '👕', '🚗', '📱', '✨'];
const BUNDLE_COLORS = [
  '#FF1744', '#0EA5E9', '#F59E0B', '#10B981',
  '#9333EA', '#EC4899', '#3B82F6', '#6366F1'
];

interface BundleItemForm {
  tempId: string;
  id?: string;
  product_id: string;
  product: Product;
  quantity: string;
  weight: string;
  estimated_price: string;
}

export const BundleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🛒',
    color: '#FF1744',
  });
  const [items, setItems] = useState<BundleItemForm[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [emptyInventoryItems, setEmptyInventoryItems] = useState<InventoryItem[]>([]);

  // Product selection modal state
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (id && products.length > 0) {
      loadBundle();
    }
  }, [id, products]);

  const loadInitialData = async () => {
    if (!user) return;
    try {
      setLoadingData(true);
      const [productsData, categoriesData, inventoryData] = await Promise.all([
        productService.getProducts(user.id),
        categoryService.getCategories(user.id),
        inventoryService.getInventoryItems(user.id, { status: 'empty' }),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setEmptyInventoryItems(inventoryData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar datos');
    } finally {
      setLoadingData(false);
    }
  };

  const loadBundle = async () => {
    if (!id) return;
    try {
      const bundle = await bundleService.getBundleById(id);
      if (bundle) {
        setFormData({
          name: bundle.name,
          description: bundle.description || '',
          icon: bundle.icon,
          color: bundle.color,
        });

        if (bundle.items) {
          const bundleItems: BundleItemForm[] = [];
          for (const item of bundle.items) {
            // Find the product in our loaded products
            const product = products.find(p => p.id === item.product_id);
            if (product) {
              bundleItems.push({
                tempId: item.id,
                id: item.id,
                product_id: item.product_id!,
                product: product,
                quantity: item.quantity?.toString() || '1',
                weight: item.weight?.toString() || '1',
                estimated_price: item.estimated_price?.toString() || '',
              });
            }
          }
          setItems(bundleItems);
        }
      }
    } catch (error) {
      console.error('Error loading bundle:', error);
      showError('Error al cargar la lista');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = !selectedCategoryFilter || product.category_id === selectedCategoryFilter;
    // Exclude products already in the bundle
    const notInBundle = !items.some(item => item.product_id === product.id);
    return matchesSearch && matchesCategory && notInBundle;
  });

  const addProduct = (product: Product) => {
    const newItem: BundleItemForm = {
      tempId: Date.now().toString(),
      product_id: product.id,
      product: product,
      quantity: '1',
      weight: '1',
      estimated_price: product.default_price?.toString() || '',
    };
    setItems([...items, newItem]);
    setShowProductPicker(false);
    setProductSearch('');
  };

  // Add empty inventory item to bundle
  const addFromEmptyInventory = (inventoryItem: InventoryItem) => {
    // Find the product from the products list
    const product = products.find(p => p.id === inventoryItem.product_id);
    if (!product) {
      // Create a mock product from inventory item data
      const mockProduct: Product = {
        id: inventoryItem.product_id || inventoryItem.id,
        user_id: inventoryItem.user_id,
        name: inventoryItem.product_name,
        category_id: inventoryItem.category_id,
        category: inventoryItem.category,
        store_id: null,
        unit_type: inventoryItem.unit === 'unidades' ? 'unit' : 'weight',
        default_price: null,
        default_unit: inventoryItem.unit,
        image_url: null,
        last_used_at: null,
        usage_count: 0,
        created_at: inventoryItem.created_at,
        updated_at: inventoryItem.updated_at,
      };
      addProduct(mockProduct);
    } else {
      addProduct(product);
    }
    // Remove from empty items list
    setEmptyInventoryItems(prev => prev.filter(i => i.id !== inventoryItem.id));
  };

  // Add all empty inventory items
  const addAllEmptyItems = () => {
    emptyInventoryItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product && !items.some(i => i.product_id === product.id)) {
        const newItem: BundleItemForm = {
          tempId: Date.now().toString() + item.id,
          product_id: product.id,
          product: product,
          quantity: '1',
          weight: '1',
          estimated_price: product.default_price?.toString() || '',
        };
        setItems(prev => [...prev, newItem]);
      }
    });
    setEmptyInventoryItems([]);
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: 'quantity' | 'weight' | 'estimated_price', value: string) => {
    setItems(items.map(item =>
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };

  const calculateEstimatedTotal = (): number => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.estimated_price) || 0;
      const qty = item.product.unit_type === 'unit'
        ? parseFloat(item.quantity) || 1
        : parseFloat(item.weight) || 1;
      return total + (price * qty);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      showError('El nombre de la lista es requerido');
      return;
    }

    if (items.length === 0) {
      showError('Agrega al menos un producto a la lista');
      return;
    }

    try {
      setLoading(true);

      const bundleData: BundleInsert = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon,
        color: formData.color,
        is_favorite: false,
      };

      let bundleId: string;

      if (id) {
        // Update existing bundle
        await bundleService.updateBundle(id, bundleData);
        bundleId = id;

        // Delete existing items
        const existingBundle = await bundleService.getBundleById(id);
        if (existingBundle?.items) {
          for (const item of existingBundle.items) {
            await bundleService.removeBundleItem(item.id);
          }
        }
      } else {
        // Create new bundle
        const createdBundle = await bundleService.createBundle(bundleData);
        bundleId = createdBundle.id;
      }

      // Add items
      for (const item of items) {
        const itemData: BundleItemInsert = {
          bundle_id: bundleId,
          product_id: item.product_id,
          product_name: item.product.name,
          category_id: item.product.category_id || null,
          store_id: item.product.store_id || null,
          unit_type: item.product.unit_type,
          quantity: item.product.unit_type === 'unit' ? parseInt(item.quantity) || 1 : null,
          weight: item.product.unit_type === 'weight' ? parseFloat(item.weight) || 1 : null,
          estimated_price: item.estimated_price ? parseFloat(item.estimated_price) : null,
          notes: null,
        };
        await bundleService.addItemToBundle(itemData);
      }

      success(id ? 'Lista actualizada' : '✨ Lista creada');
      navigate(ROUTES.APP.BUNDLES);
    } catch (error) {
      console.error('Error saving bundle:', error);
      showError('Error al guardar la lista');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100">
              {id ? 'Editar Lista' : 'Nueva Lista'}
            </h1>
            <button
              onClick={() => navigate(ROUTES.APP.BUNDLES)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X size={24} className="text-neutral-500" />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Bundle Info */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Icon & Color */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Icono</label>
              <div className="flex flex-wrap gap-2">
                {BUNDLE_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      formData.icon === icon
                        ? 'bg-primary-100 dark:bg-primary-900/30 scale-110'
                        : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {BUNDLE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-9 h-9 rounded-lg transition-all ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Nombre de la lista *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Compra Semanal, Despensa Básica..."
              required
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción de la lista..."
              rows={2}
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Empty Inventory Items - Quick Add */}
        {emptyInventoryItems.length > 0 && !id && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                  Necesitas comprar ({emptyInventoryItems.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={addAllEmptyItems}
                className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                Añadir todos
              </button>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Productos que se han acabado en tu inventario
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {emptyInventoryItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addFromEmptyInventory(item)}
                  className="flex-shrink-0 bg-white dark:bg-neutral-800 rounded-xl p-3 flex items-center gap-2 hover:shadow-md transition-all border border-neutral-200 dark:border-neutral-700"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: (item.category?.color || '#6366F1') + '20' }}
                  >
                    {item.category?.icon || '📦'}
                  </div>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm whitespace-nowrap">
                    {item.product_name}
                  </span>
                  <Plus size={16} className="text-red-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products in Bundle */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Productos ({items.length})
            </h2>
            {items.length > 0 && (
              <p className="text-sm text-neutral-500">
                Total estimado: <span className="font-bold text-primary-500">${calculateEstimatedTotal().toFixed(2)}</span>
              </p>
            )}
          </div>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={() => setShowProductPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} />
            Agregar producto del catálogo
          </button>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
              <p className="text-neutral-500 dark:text-neutral-400">
                No hay productos en la lista
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Agrega productos de tu catálogo
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.tempId}
                  className="bg-neutral-50 dark:bg-neutral-700/50 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: (item.product.category?.color || '#6366F1') + '20' }}
                    >
                      {item.product.category?.icon || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.product.category?.name || 'Sin categoría'} •{' '}
                        {item.product.unit_type === 'unit' ? 'Por unidad' : 'Por peso'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.tempId)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        {item.product.unit_type === 'unit' ? 'Cantidad' : 'Peso (kg)'}
                      </label>
                      <input
                        type="number"
                        step={item.product.unit_type === 'weight' ? '0.001' : '1'}
                        min="0"
                        value={item.product.unit_type === 'unit' ? item.quantity : item.weight}
                        onChange={(e) => updateItem(
                          item.tempId,
                          item.product.unit_type === 'unit' ? 'quantity' : 'weight',
                          e.target.value
                        )}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-600 border-0 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        Precio estimado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.estimated_price}
                          onChange={(e) => updateItem(item.tempId, 'estimated_price', e.target.value)}
                          className="w-full pl-7 pr-3 py-2 bg-white dark:bg-neutral-600 border-0 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 pt-8">
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-accent-500 to-orange-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={20} />
            {loading ? 'Guardando...' : id ? 'Actualizar Lista' : 'Crear Lista'}
          </button>
        </div>
      </form>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowProductPicker(false);
              setProductSearch('');
            }
          }}
        >
          <div className="bg-white dark:bg-neutral-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                  Agregar Producto
                </h2>
                <button
                  onClick={() => {
                    setShowProductPicker(false);
                    setProductSearch('');
                  }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm text-neutral-900 dark:text-neutral-100"
                  autoFocus
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedCategoryFilter === null
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Todos
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryFilter(category.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                      selectedCategoryFilter === category.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4">
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package size={40} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-neutral-500">Tu catálogo está vacío</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Crea productos primero en tu catálogo
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Search size={40} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-neutral-500">No hay productos disponibles</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    Todos los productos ya están en la lista
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full bg-neutral-50 dark:bg-neutral-700 rounded-xl p-3 flex items-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: (product.category?.color || '#6366F1') + '20' }}
                      >
                        {product.category?.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {product.category?.name}
                          {product.default_price && ` • $${product.default_price.toFixed(2)}`}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-neutral-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
