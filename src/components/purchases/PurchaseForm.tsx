import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
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
  Check,
  Trash2,
  ShoppingCart
} from 'lucide-react';

// Interface for product details in multi-selection
interface ProductSelection {
  product: Product;
  quantity: string;
  unitPrice: string;
}

export const PurchaseForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  // Get pre-selected product from navigation state (from ProductsPage quick buy)
  const preSelectedProduct = location.state?.product as Product | undefined;

  const [step, setStep] = useState<'product' | 'details'>(preSelectedProduct ? 'details' : 'product');

  // Multi-product selection state
  const [selectedProducts, setSelectedProducts] = useState<Map<string, ProductSelection>>(() => {
    if (preSelectedProduct) {
      const map = new Map<string, ProductSelection>();
      map.set(preSelectedProduct.id, {
        product: preSelectedProduct,
        quantity: '1',
        unitPrice: preSelectedProduct.default_price?.toString() || '',
      });
      return map;
    }
    return new Map();
  });

  // Product selection state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Shared purchase details state
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

  // Toggle product selection
  const toggleProduct = (product: Product) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(product.id)) {
        newMap.delete(product.id);
      } else {
        newMap.set(product.id, {
          product,
          quantity: '1',
          unitPrice: product.default_price?.toString() || '',
        });
      }
      return newMap;
    });
  };

  // Update product details
  const updateProductDetail = (productId: string, field: 'quantity' | 'unitPrice', value: string) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(productId);
      if (item) {
        newMap.set(productId, { ...item, [field]: value });
      }
      return newMap;
    });
  };

  // Remove product from selection
  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      newMap.delete(productId);
      return newMap;
    });
  };

  const handleProductCreated = () => {
    loadInitialData();
    setShowCreateProduct(false);
  };

  // Calculate total for single product
  const calculateProductTotal = (selection: ProductSelection): number => {
    const qty = parseFloat(selection.quantity) || 0;
    const price = parseFloat(selection.unitPrice) || 0;
    return qty * price;
  };

  // Calculate grand total for all products
  const calculateGrandTotal = (): number => {
    let total = 0;
    selectedProducts.forEach((selection) => {
      total += calculateProductTotal(selection);
    });
    return total;
  };

  // Proceed to details step
  const goToDetails = () => {
    if (selectedProducts.size === 0) {
      showError('Selecciona al menos un producto');
      return;
    }
    setStep('details');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || selectedProducts.size === 0) {
      showError('Selecciona al menos un producto');
      return;
    }

    // Validate all products have quantity and price
    let hasError = false;
    selectedProducts.forEach((selection) => {
      if (!selection.quantity || !selection.unitPrice) {
        hasError = true;
      }
    });

    if (hasError) {
      showError('Completa cantidad y precio para todos los productos');
      return;
    }

    setLoading(true);

    try {
      // Create purchases for all selected products
      const purchasePromises = Array.from(selectedProducts.values()).map(async (selection) => {
        const { product, quantity, unitPrice } = selection;
        const qty = parseFloat(quantity) || 0;
        const price = parseFloat(unitPrice) || 0;
        const total = qty * price;

        const purchase = await purchaseService.createPurchase({
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          category_id: product.category_id || null,
          store_id: storeId || null,
          unit_type: product.unit_type,
          quantity: product.unit_type === 'unit' ? parseInt(quantity) : null,
          weight: product.unit_type === 'weight' ? parseFloat(quantity) : null,
          unit_price: product.unit_type === 'unit' ? price : null,
          price_per_unit: product.unit_type === 'weight' ? price : null,
          total_price: total,
          purchase_date: purchaseDate,
          notes: notes || null,
          image_url: null,
        });

        // Update product usage
        await productService.updateProduct(product.id, {
          usage_count: (product.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        });

        // Create inventory item if enabled
        if (addToInventory) {
          const unit = product.unit_type === 'unit' ? 'unidades' : (product.default_unit || 'kg');

          await inventoryService.addOrMergeInventoryItem({
            user_id: user.id,
            product_id: product.id,
            product_name: product.name,
            category_id: product.category_id || null,
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

        return purchase;
      });

      await Promise.all(purchasePromises);

      const count = selectedProducts.size;
      const message = count === 1
        ? (addToInventory ? '✨ Compra registrada y añadida al inventario' : '✨ Compra registrada')
        : (addToInventory ? `✨ ${count} compras registradas y añadidas al inventario` : `✨ ${count} compras registradas`);

      success(message);
      navigate('/');
    } catch (err: any) {
      console.error('Error creating purchase:', err);
      showError(err.message || 'Error al registrar las compras');
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = calculateGrandTotal();

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
                  Paso 1: Selecciona productos
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
                placeholder="Buscar productos..."
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

        {/* Selected Products Counter */}
        {selectedProducts.size > 0 && (
          <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary-500" />
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''} seleccionado{selectedProducts.size !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setSelectedProducts(new Map())}
                className="text-xs text-primary-500 font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="px-4 py-4 pb-40">
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
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product)}
                    className={`w-full rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-500'
                        : 'bg-white dark:bg-neutral-800'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? 'bg-primary-500'
                          : 'bg-neutral-100 dark:bg-neutral-700 border-2 border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>

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
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 pt-8">
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateProduct(true)}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold rounded-xl"
            >
              <Plus size={18} />
              Nuevo
            </button>
            <button
              onClick={goToDetails}
              disabled={selectedProducts.size === 0}
              className={`flex-[2] flex items-center justify-center gap-2 py-4 font-bold rounded-xl shadow-lg transition-all ${
                selectedProducts.size > 0
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
                  : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed'
              }`}
            >
              Continuar
              {selectedProducts.size > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {selectedProducts.size}
                </span>
              )}
            </button>
          </div>
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
  const selectedProductsArray = Array.from(selectedProducts.values());

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
                Paso 2: Detalles de {selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''}
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

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-4">
        {/* Back to selection */}
        <button
          type="button"
          onClick={() => setStep('product')}
          className="text-sm text-primary-500 font-medium flex items-center gap-1"
        >
          ← Agregar más productos
        </button>

        {/* Selected Products List */}
        <div className="space-y-3">
          {selectedProductsArray.map((selection) => {
            const { product, quantity: qty, unitPrice: price } = selection;
            const productTotal = calculateProductTotal(selection);

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm"
              >
                {/* Product Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: (product.category?.color || '#6366F1') + '20' }}
                  >
                    {product.category?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {product.name}
                    </p>
                    <span className="text-xs text-neutral-500">
                      {product.unit_type === 'unit' ? '📦 Por unidad' : '⚖️ Por peso'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      {product.unit_type === 'unit' ? 'Cantidad' : 'Peso (kg)'}
                    </label>
                    <input
                      type="number"
                      step={product.unit_type === 'weight' ? '0.001' : '1'}
                      value={qty}
                      onChange={(e) => updateProductDetail(product.id, 'quantity', e.target.value)}
                      placeholder="1"
                      required
                      className="w-full px-3 py-2.5 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-lg text-lg font-bold text-center focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">
                      {product.unit_type === 'unit' ? 'Precio/ud' : 'Precio/kg'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => updateProductDetail(product.id, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full pl-7 pr-3 py-2.5 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-lg text-lg font-bold text-center focus:ring-2 focus:ring-primary-500 focus:outline-none text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Subtotal */}
                {qty && price && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Subtotal</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      ${productTotal.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grand Total */}
        {grandTotal > 0 && (
          <div className="bg-gradient-to-r from-primary-500 to-pink-500 rounded-2xl p-4 text-white text-center shadow-lg">
            <p className="text-xs font-medium opacity-80 mb-1">
              Total ({selectedProducts.size} producto{selectedProducts.size !== 1 ? 's' : ''})
            </p>
            <p className="text-3xl font-black">${grandTotal.toFixed(2)}</p>
          </div>
        )}

        {/* Date and Store */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm space-y-4">
          <DatePicker
            label="Fecha de compra"
            value={purchaseDate}
            onChange={setPurchaseDate}
            maxDate={new Date().toISOString().split('T')[0]}
            placeholder="Seleccionar fecha"
          />

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
              <DatePicker
                label="Fecha de caducidad (opcional)"
                value={expirationDate}
                onChange={setExpirationDate}
                minDate={new Date().toISOString().split('T')[0]}
                placeholder="Seleccionar caducidad"
              />
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
            disabled={selectedProducts.size === 0}
            className="shadow-xl"
          >
            <Check size={20} className="mr-2" />
            {selectedProducts.size === 1 ? 'Guardar Compra' : `Guardar ${selectedProducts.size} Compras`}
          </Button>
        </div>
      </form>
    </div>
  );
};
