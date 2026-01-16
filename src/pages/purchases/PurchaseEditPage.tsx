import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { TagPicker } from '@/components/tags/TagPicker';
import { purchaseService } from '@/services/purchase.service';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { tagService } from '@/services/tag.service';
import { storeService } from '@/services/store.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Product, Category, Tag, Store } from '@/types/models';
import { Package, Scale, Calendar, DollarSign, X, Search, Loader2, Trash2, Tag as TagIcon, Store as StoreIcon } from 'lucide-react';

export const PurchaseEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unitType, setUnitType] = useState<'unit' | 'weight'>('unit');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [, setSelectedProduct] = useState<Product | null>(null);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    storeId: '',
    quantity: '',
    unitPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (productSearch.length >= 2) {
      searchProducts(productSearch);
    } else {
      setProducts([]);
      setShowProductSuggestions(false);
    }
  }, [productSearch]);

  const loadData = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      const [purchase, categoriesData, storesData] = await Promise.all([
        purchaseService.getPurchaseById(id),
        categoryService.getCategories(user.id),
        storeService.getStores(user.id),
      ]);

      if (!purchase) {
        showError('Compra no encontrada');
        navigate('/purchases');
        return;
      }

      // Load tags for this purchase
      const purchaseTags = await tagService.getPurchaseTags(id);

      setCategories(categoriesData);
      setStores(storesData);
      setUnitType(purchase.unit_type);
      setProductSearch(purchase.product_name);
      setSelectedTags(purchaseTags);

      setFormData({
        productName: purchase.product_name,
        categoryId: purchase.category_id || '',
        storeId: purchase.store_id || '',
        quantity: purchase.unit_type === 'unit'
          ? (purchase.quantity?.toString() || '')
          : (purchase.weight?.toString() || ''),
        unitPrice: purchase.unit_type === 'unit'
          ? (purchase.unit_price?.toString() || '')
          : (purchase.price_per_unit?.toString() || ''),
        purchaseDate: purchase.purchase_date,
        notes: purchase.notes || '',
      });
    } catch (error) {
      console.error('Error loading purchase:', error);
      showError('Error al cargar la compra');
      navigate('/purchases');
    } finally {
      setLoading(false);
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
      unitPrice: product.default_price?.toString() || '',
    }));
    setUnitType(product.unit_type);
    setShowProductSuggestions(false);
  };

  const calculateTotal = (): number => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    return quantity * price;
  };

  const handleDelete = async () => {
    if (!id || !user) return;

    if (!confirm('¿Estás seguro de eliminar esta compra?')) return;

    try {
      setSaving(true);
      await purchaseService.deletePurchase(id);
      success('Compra eliminada');
      navigate('/purchases');
    } catch (err: any) {
      console.error('Error deleting purchase:', err);
      showError(err.message || 'Error al eliminar la compra');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !id) {
      showError('Error: usuario o compra no encontrados');
      return;
    }

    if (!formData.productName || !formData.categoryId || !formData.storeId || !formData.quantity || !formData.unitPrice) {
      showError('Por favor completa todos los campos requeridos');
      return;
    }

    setSaving(true);

    try {
      await purchaseService.updatePurchase(id, {
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
      });

      // Update tags
      await tagService.setTagsForPurchase(
        id,
        selectedTags.map(tag => tag.id)
      );

      success('✨ Compra actualizada correctamente');
      navigate('/purchases');
    } catch (err: any) {
      console.error('Error updating purchase:', err);
      showError(err.message || 'Error al actualizar la compra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Cargando compra...</p>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-700/50 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
              Editar Compra
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-full transition-colors disabled:opacity-50"
                title="Eliminar compra"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={() => navigate('/purchases')}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-8">
        {/* Unit Type Toggle */}
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-2 shadow-lg mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setUnitType('unit')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all duration-200 ${
              unitType === 'unit'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
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
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
          >
            <Scale className="inline mr-2" size={20} />
            Por Peso
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
          {/* Product Search with Autocomplete */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={20} />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setFormData(prev => ({ ...prev, productName: e.target.value }));
                }}
                onFocus={() => products.length > 0 && setShowProductSuggestions(true)}
                placeholder="Buscar producto..."
                className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 rounded-2xl focus:border-primary-500 focus:outline-none text-lg font-medium transition-colors"
                required
              />
            </div>

            {/* Suggestions Dropdown */}
            {showProductSuggestions && (
              <div className="absolute z-10 w-full mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border-2 border-neutral-100 dark:border-neutral-700 max-h-64 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className="w-full px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-neutral-700 transition-colors border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                  >
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      ${product.default_price?.toFixed(2)} • Usado {product.usage_count} veces
                    </div>
                  </button>
                ))}
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

          {/* Quantity and Price - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.01"
              label={unitType === 'unit' ? 'Cantidad' : 'Peso (kg)'}
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder={unitType === 'unit' ? '1' : '0.5'}
              icon={unitType === 'unit' ? <Package size={20} /> : <Scale size={20} />}
              required
            />

            <Input
              type="number"
              step="0.01"
              label={unitType === 'unit' ? 'Precio unitario' : 'Precio por kg'}
              value={formData.unitPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
              placeholder="0.00"
              icon={<DollarSign size={20} />}
              required
            />
          </div>

          {/* Total Display */}
          {formData.quantity && formData.unitPrice && (
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
              <p className="text-sm font-medium opacity-90 mb-1">Total</p>
              <p className="text-5xl font-black">${total.toFixed(2)}</p>
            </div>
          )}

          {/* Date */}
          <Input
            type="date"
            label="Fecha"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
            icon={<Calendar size={20} />}
            required
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Añade comentarios sobre esta compra..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 rounded-2xl focus:border-primary-500 focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
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
            loading={saving}
            className="shadow-2xl"
          >
            Actualizar Compra
          </Button>
        </div>
      </form>
    </div>
  );
};
