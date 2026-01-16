import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { TagPicker } from '@/components/tags/TagPicker';
import { QuickProductCreate } from '@/components/purchases/QuickProductCreate';
import { purchaseService } from '@/services/purchase.service';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { tagService } from '@/services/tag.service';
import { storeService } from '@/services/store.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Product, Category, Tag, Store } from '@/types/models';
import { Package, Scale, Calendar, X, Search, Tag as TagIcon, Store as StoreIcon, Plus } from 'lucide-react';

export const PurchaseForm = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [unitType, setUnitType] = useState<'unit' | 'weight'>('unit');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    storeId: '',
    quantity: '',
    unitPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategoriesAndStores();
  }, []);

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts(productSearch);
    } else {
      setProducts([]);
      setShowProductSuggestions(false);
    }
  }, [productSearch]);

  const loadCategoriesAndStores = async () => {
    if (!user) return;
    try {
      const [categoriesData, storesData] = await Promise.all([
        categoryService.getCategories(user.id),
        storeService.getStores(user.id),
      ]);
      setCategories(categoriesData);
      setStores(storesData);
    } catch (err) {
      console.error('Error loading data:', err);
      showError('Error al cargar categorías y tiendas');
    }
  };

  const searchProducts = async (query: string) => {
    if (!user) return;

    try {
      const results = await productService.searchProducts(user.id, query);
      setProducts(results);
      setShowProductSuggestions(results.length > 0);
    } catch (err) {
      console.error('Error searching products:', err);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setFormData(prev => ({
      ...prev,
      productName: product.name,
      categoryId: product.category_id || '',
      storeId: product.store_id || '',
      unitPrice: product.default_price?.toString() || '',
    }));
    setUnitType(product.unit_type);
    setShowProductSuggestions(false);
  };

  const handleProductCreated = (product: Product) => {
    selectProduct(product);
  };

  const calculateTotal = (): number => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    return quantity * price;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      showError('Debes iniciar sesión');
      return;
    }

    if (!formData.productName || !formData.categoryId || !formData.storeId || !formData.quantity || !formData.unitPrice) {
      showError('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const purchase = await purchaseService.createPurchase({
        user_id: user.id,
        product_id: selectedProduct?.id || null,
        product_name: formData.productName,
        category_id: formData.categoryId,
        store_id: formData.storeId,
        unit_type: unitType,
        quantity: unitType === 'unit' ? parseInt(formData.quantity) : null,
        weight: unitType === 'weight' ? parseFloat(formData.quantity) : null,
        unit_price: unitType === 'unit' ? parseFloat(formData.unitPrice) : null,
        price_per_unit: unitType === 'weight' ? parseFloat(formData.unitPrice) : null,
        total_price: calculateTotal(),
        purchase_date: formData.purchaseDate,
        notes: formData.notes || null,
        image_url: null,
      });

      // Add tags to purchase
      if (selectedTags.length > 0) {
        await tagService.setTagsForPurchase(
          purchase.id,
          selectedTags.map(tag => tag.id)
        );
      }

      success('✨ Compra registrada correctamente');
      navigate('/');
    } catch (err: any) {
      console.error('Error creating purchase:', err);
      showError(err.message || 'Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-neutral-200/50 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-neutral-900">
              Nueva Compra
            </h1>
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-8">
        {/* Unit Type Toggle */}
        <div className="bg-white rounded-3xl p-2 shadow-lg mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setUnitType('unit')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-200 ${
              unitType === 'unit'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Package className="inline mr-2" size={20} />
            Por Unidad
          </button>
          <button
            type="button"
            onClick={() => setUnitType('weight')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-200 ${
              unitType === 'weight'
                ? 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white shadow-lg'
                : 'text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <Scale className="inline mr-2" size={20} />
            Por Peso
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl space-y-6">
          {/* Product Search with Autocomplete */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setFormData(prev => ({ ...prev, productName: e.target.value }));
                }}
                onFocus={() => products.length > 0 && setShowProductSuggestions(true)}
                placeholder="Buscar producto..."
                className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 rounded-2xl focus:border-primary-500 focus:outline-none text-lg font-medium transition-colors"
                required
              />
            </div>

            {/* Suggestions Dropdown */}
            {showProductSuggestions && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-neutral-100 max-h-64 overflow-y-auto">
                {products.length > 0 ? (
                  products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => selectProduct(product)}
                      className="w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-neutral-100 last:border-0"
                    >
                      <div className="font-semibold text-neutral-900">{product.name}</div>
                      <div className="text-sm text-neutral-500 mt-1">
                        ${product.default_price?.toFixed(2)} • Usado {product.usage_count} veces
                      </div>
                    </button>
                  ))
                ) : null}

                {/* Create new product button */}
                {productSearch.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickCreate(true);
                      setShowProductSuggestions(false);
                    }}
                    className="w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 transition-colors border-t-2 border-primary-200 flex items-center gap-2 text-primary-700 font-bold"
                  >
                    <Plus size={20} />
                    Crear "{productSearch}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Category */}
          <Select
            label="Categoría"
            icon={<TagIcon size={20} />}
            value={formData.categoryId}
            onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </Select>

          {/* Store */}
          <Select
            label="Tienda / Supermercado"
            icon={<StoreIcon size={20} />}
            value={formData.storeId}
            onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
            required
          >
            <option value="">Selecciona una tienda</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.icon} {store.name}
              </option>
            ))}
          </Select>

          {/* Quantity, Price, and Date - Better mobile layout */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">
                {unitType === 'unit' ? 'Cantidad' : 'Peso (kg)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder={unitType === 'unit' ? '1' : '0.5'}
                required
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-lg font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">
                {unitType === 'unit' ? 'Precio unit.' : 'Precio/kg'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="w-full pl-8 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors text-lg font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Total Display */}
          {formData.quantity && formData.unitPrice && (
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
              <p className="text-xs font-bold opacity-90 mb-1">Total a pagar</p>
              <p className="text-4xl font-black">${total.toFixed(2)}</p>
            </div>
          )}

          {/* Date - Compact design */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              Fecha de compra
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
              required
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors font-bold"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Añade comentarios sobre esta compra..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-2xl focus:border-primary-500 focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Etiquetas (opcional)
            </label>
            <TagPicker
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>
        </div>

        {/* Submit Button - Fixed positioning to avoid BottomNav overlap */}
        <div className="mt-8 mb-20">
          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            className="shadow-2xl"
          >
            Guardar Compra
          </Button>
        </div>
      </form>

      {/* Quick Product Create Modal */}
      <QuickProductCreate
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onProductCreated={handleProductCreated}
        categories={categories}
        stores={stores}
        initialName={productSearch}
        initialUnitType={unitType}
      />
    </div>
  );
};
