import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { purchaseService } from '@/services/purchase.service';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { storeService } from '@/services/store.service';
import { inventoryService } from '@/services/inventory.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Product, Category, Store, StorageLocation } from '@/types/models';
import {
  Package,
  X,
  Search,
  Plus,
  Archive,
  MapPin,
  Calendar,
  ChevronRight,
  Check
} from 'lucide-react';

export const PurchaseForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  // Get pre-selected product from navigation state (from ProductsPage quick buy)
  const preSelectedProduct = location.state?.product as Product | undefined;

  const [step, setStep] = useState<'product' | 'details'>(preSelectedProduct ? 'details' : 'product');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(preSelectedProduct || null);

  // Product selection state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Purchase details state
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');

  // Inventory state
  const [addToInventory, setAddToInventory] = useState(true);
  const [locationId, setLocationId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      // Pre-fill price from product defaults
      if (selectedProduct.default_price) {
        setUnitPrice(selectedProduct.default_price.toString());
      }
      // Pre-fill store from product defaults
      if (selectedProduct.store_id) {
        setStoreId(selectedProduct.store_id);
      }
    }
  }, [selectedProduct]);

  const loadInitialData = async () => {
    if (!user) return;
    try {
      setLoadingData(true);
      const [productsData, categoriesData, storesData, locationsData] = await Promise.all([
        productService.getProducts(user.id),
        categoryService.getCategories(user.id),
        storeService.getStores(user.id),
        inventoryService.getStorageLocations(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setStores(storesData);
      setLocations(locationsData);

      // Set default location
      if (locationsData.length > 0) {
        setLocationId(locationsData[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      showError('Error al cargar datos');
    } finally {
      setLoadingData(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setStep('details');
  };

  const handleProductCreated = () => {
    loadInitialData();
    setShowCreateProduct(false);
  };

  const calculateTotal = (): number => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    return qty * price;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !selectedProduct) {
      showError('Selecciona un producto');
      return;
    }

    if (!quantity || !unitPrice) {
      showError('Completa cantidad y precio');
      return;
    }

    setLoading(true);

    try {
      const purchase = await purchaseService.createPurchase({
        user_id: user.id,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        category_id: selectedProduct.category_id || null,
        store_id: storeId || null,
        unit_type: selectedProduct.unit_type,
        quantity: selectedProduct.unit_type === 'unit' ? parseInt(quantity) : null,
        weight: selectedProduct.unit_type === 'weight' ? parseFloat(quantity) : null,
        unit_price: selectedProduct.unit_type === 'unit' ? parseFloat(unitPrice) : null,
        price_per_unit: selectedProduct.unit_type === 'weight' ? parseFloat(unitPrice) : null,
        total_price: calculateTotal(),
        purchase_date: purchaseDate,
        notes: notes || null,
        image_url: null,
      });

      // Update product usage
      await productService.updateProduct(selectedProduct.id, {
        usage_count: (selectedProduct.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      });

      // Create inventory item if enabled
      if (addToInventory) {
        const qty = parseFloat(quantity) || 0;
        const unit = selectedProduct.unit_type === 'unit' ? 'unidades' : (selectedProduct.default_unit || 'kg');

        await inventoryService.createInventoryItem({
          user_id: user.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          category_id: selectedProduct.category_id || null,
          purchase_id: purchase.id,
          initial_quantity: qty,
          current_quantity: qty,
          unit: unit,
          location_id: locationId || null,
          minimum_quantity: 1,
          expiration_date: expirationDate || null,
          opened_at: null,
          notes: null,
          image_url: null,
        });
      }

      success(addToInventory ? '✨ Compra registrada y añadida al inventario' : '✨ Compra registrada');
      navigate('/');
    } catch (err: any) {
      console.error('Error creating purchase:', err);
      showError(err.message || 'Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  // STEP 1: Product Selection
  if (step === 'product') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                  Nueva Compra
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Paso 1: Selecciona el producto
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X size={24} className="text-neutral-500" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-12 pr-4 py-3 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
                autoFocus
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                selectedCategory === null
                  ? 'bg-primary-500 text-white'
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
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products List */}
        <div className="px-4 py-4 pb-32">
          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" size={48} />
              <p className="text-neutral-500 dark:text-neutral-400 mb-2">
                {searchQuery ? 'No se encontraron productos' : 'Tu catálogo está vacío'}
              </p>
              <p className="text-sm text-neutral-400 mb-4">
                Crea un producto primero para poder registrar compras
              </p>
              <button
                onClick={() => setShowCreateProduct(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white font-medium rounded-xl"
              >
                <Plus size={18} />
                Crear producto
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  className="w-full bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: (product.category?.color || '#6366F1') + '20' }}
                  >
                    {product.category?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {product.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {product.category?.name || 'Sin categoría'}
                      {product.default_price && ` • $${product.default_price.toFixed(2)}`}
                    </p>
                  </div>
                  <ChevronRight className="text-neutral-300 flex-shrink-0" size={20} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Product Button (Fixed) */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 pt-8">
          <button
            onClick={() => setShowCreateProduct(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold rounded-xl shadow-lg"
          >
            <Plus size={20} />
            Crear nuevo producto
          </button>
        </div>

        {/* Create Product Modal */}
        <ProductFormModal
          isOpen={showCreateProduct}
          onClose={() => setShowCreateProduct(false)}
          onSuccess={handleProductCreated}
          product={null}
        />
      </div>
    );
  }

  // STEP 2: Purchase Details
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                Nueva Compra
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Paso 2: Detalles de la compra
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X size={24} className="text-neutral-500" />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Selected Product Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: (selectedProduct?.category?.color || '#6366F1') + '20' }}
            >
              {selectedProduct?.category?.icon || '📦'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-neutral-900 dark:text-neutral-100">
                {selectedProduct?.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-neutral-600 dark:text-neutral-400">
                  {selectedProduct?.unit_type === 'unit' ? '📦 Por unidad' : '⚖️ Por peso'}
                </span>
                {selectedProduct?.category && (
                  <span className="text-xs text-neutral-500">
                    {selectedProduct.category.name}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep('product')}
              className="text-sm text-primary-500 font-medium"
            >
              Cambiar
            </button>
          </div>
        </div>

        {/* Quantity and Price */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                {selectedProduct?.unit_type === 'unit' ? 'Cantidad' : 'Peso (kg)'}
              </label>
              <input
                type="number"
                step={selectedProduct?.unit_type === 'weight' ? '0.001' : '1'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                required
                className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl text-xl font-bold text-center focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                {selectedProduct?.unit_type === 'unit' ? 'Precio/ud' : 'Precio/kg'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl text-xl font-bold text-center focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          {/* Total Display */}
          {quantity && unitPrice && (
            <div className="bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl p-4 text-white text-center">
              <p className="text-xs font-medium opacity-80 mb-1">Total</p>
              <p className="text-3xl font-black">${total.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Date and Store */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Fecha de compra
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Tienda (opcional)
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
            >
              <option value="">Sin tienda específica</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.icon} {store.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añadir notas..."
              rows={2}
              className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>

        {/* Inventory Section */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setAddToInventory(!addToInventory)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${addToInventory ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-neutral-100 dark:bg-neutral-700'}`}>
                <Archive size={20} className={addToInventory ? 'text-amber-600' : 'text-neutral-400'} />
              </div>
              <div className="text-left">
                <p className="font-bold text-neutral-900 dark:text-neutral-100">Añadir al inventario</p>
                <p className="text-xs text-neutral-500">Guardar en tu despensa</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors relative ${addToInventory ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${addToInventory ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </button>

          {addToInventory && (
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 space-y-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center gap-1">
                  <MapPin size={14} />
                  Ubicación
                </label>
                <div className="flex gap-2 flex-wrap">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => setLocationId(location.id)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                        locationId === location.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span>{location.icon}</span>
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2 flex items-center gap-1">
                  <Calendar size={14} />
                  Fecha de caducidad (opcional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 pt-8">
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            className="shadow-xl"
          >
            <Check size={20} className="mr-2" />
            Guardar Compra
          </Button>
        </div>
      </form>
    </div>
  );
};
