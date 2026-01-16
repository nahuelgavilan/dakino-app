import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bundleService } from '@/services/bundle.service';
import { productService } from '@/services/product.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { BundleInsert, BundleItemInsert, Product } from '@/types/models';
import { X, Plus, Trash2, Package } from 'lucide-react';

const BUNDLE_ICONS = ['📦', '🛒', '🏪', '🍎', '🧹', '🏠', '💊', '🎮', '👕', '🚗', '📱', '✨'];
const BUNDLE_COLORS = [
  '#FF1744', '#0EA5E9', '#F59E0B', '#10B981',
  '#9333EA', '#EC4899', '#3B82F6', '#6366F1'
];

interface BundleItemForm {
  tempId: string;
  product_id: string | null;
  product_name: string;
  category_id: string | null;
  unit_type: 'unit' | 'weight';
  quantity: string;
  weight: string;
  estimated_price: string;
  notes: string;
}

export const BundleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📦',
    color: '#FF1744',
  });
  const [items, setItems] = useState<BundleItemForm[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    if (id) {
      loadBundle();
    }
  }, [id]);

  useEffect(() => {
    if (productSearch.length >= 2 && user) {
      searchProducts();
    } else {
      setProductSuggestions([]);
    }
  }, [productSearch, user]);

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
          setItems(bundle.items.map(item => ({
            tempId: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            category_id: item.category_id,
            unit_type: item.unit_type,
            quantity: item.quantity?.toString() || '',
            weight: item.weight?.toString() || '',
            estimated_price: item.estimated_price?.toString() || '',
            notes: item.notes || '',
          })));
        }
      }
    } catch (error) {
      console.error('Error loading bundle:', error);
      showError('Error al cargar el bundle');
    }
  };

  const searchProducts = async () => {
    if (!user) return;
    try {
      const results = await productService.searchProducts(user.id, productSearch);
      setProductSuggestions(results);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const addItem = (product?: Product) => {
    const newItem: BundleItemForm = {
      tempId: Date.now().toString(),
      product_id: product?.id || null,
      product_name: product?.name || '',
      category_id: product?.category_id || null,
      unit_type: product?.unit_type || 'unit',
      quantity: '',
      weight: '',
      estimated_price: product?.default_price?.toString() || '',
      notes: '',
    };
    setItems([...items, newItem]);
    setProductSearch('');
    setProductSuggestions([]);
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof BundleItemForm, value: string) => {
    setItems(items.map(item =>
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      showError('El nombre del bundle es requerido');
      return;
    }

    if (items.length === 0) {
      showError('Agrega al menos un producto al bundle');
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

        // TODO: Update items (for now, we skip this - would need to compare and update)
      } else {
        // Create new bundle
        const createdBundle = await bundleService.createBundle(bundleData);
        bundleId = createdBundle.id;

        // Add items
        for (const item of items) {
          const itemData: BundleItemInsert = {
            bundle_id: bundleId,
            product_id: item.product_id,
            product_name: item.product_name,
            category_id: item.category_id,
            unit_type: item.unit_type,
            quantity: item.unit_type === 'unit' && item.quantity ? parseInt(item.quantity) : null,
            weight: item.unit_type === 'weight' && item.weight ? parseFloat(item.weight) : null,
            estimated_price: item.estimated_price ? parseFloat(item.estimated_price) : null,
            notes: item.notes || null,
          };
          await bundleService.addItemToBundle(itemData);
        }
      }

      success(id ? 'Bundle actualizado' : '✨ Bundle creado correctamente');
      navigate('/bundles');
    } catch (error) {
      console.error('Error saving bundle:', error);
      showError('Error al guardar el bundle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-accent-50/20 to-primary-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-neutral-200/50 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-neutral-900">
              {id ? 'Editar Bundle' : 'Nuevo Bundle'}
            </h1>
            <button
              onClick={() => navigate('/bundles')}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Bundle Info */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-xl font-black text-neutral-900 mb-4">Información del Bundle</h2>

          {/* Icon Selector */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-2">Icono</label>
            <div className="flex flex-wrap gap-2">
              {BUNDLE_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`text-3xl p-3 rounded-xl transition-all ${
                    formData.icon === icon
                      ? 'bg-accent-100 scale-110'
                      : 'bg-neutral-100 hover:bg-neutral-200'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {BUNDLE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    formData.color === color ? 'ring-4 ring-neutral-300 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-2">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Compra Semanal, Despensa Básica..."
              required
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-accent-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional..."
              rows={2}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-accent-500 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <h2 className="text-xl font-black text-neutral-900 mb-4">Productos en el Bundle</h2>

          {/* Search & Add */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-700 mb-2">Buscar producto</label>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar en tu catálogo..."
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-accent-500 focus:outline-none transition-colors"
              />

              {productSuggestions.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border-2 border-neutral-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                  {productSuggestions.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addItem(product)}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0"
                    >
                      <p className="font-bold text-neutral-900">{product.name}</p>
                      <p className="text-sm text-neutral-500">
                        {product.category?.name} • {product.unit_type === 'unit' ? 'Por unidad' : 'Por peso'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => addItem()}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
            >
              <Plus size={20} />
              Agregar producto manualmente
            </button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <Package size={48} className="mx-auto mb-2 opacity-50" />
              <p>No hay productos agregados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.tempId} className="bg-neutral-50 rounded-2xl p-4 border-2 border-neutral-100">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => updateItem(item.tempId, 'product_name', e.target.value)}
                      placeholder="Nombre del producto"
                      required
                      className="flex-1 font-bold text-neutral-900 bg-transparent border-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.tempId)}
                      className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 mb-1">
                        {item.unit_type === 'unit' ? 'Cantidad' : 'Peso (kg)'}
                      </label>
                      <input
                        type="number"
                        step={item.unit_type === 'weight' ? '0.001' : '1'}
                        value={item.unit_type === 'unit' ? item.quantity : item.weight}
                        onChange={(e) => updateItem(
                          item.tempId,
                          item.unit_type === 'unit' ? 'quantity' : 'weight',
                          e.target.value
                        )}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-accent-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 mb-1">
                        Precio estimado
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.estimated_price}
                        onChange={(e) => updateItem(item.tempId, 'estimated_price', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-accent-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/bundles')}
            className="flex-1 px-6 py-4 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-accent-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : id ? 'Actualizar Bundle' : 'Crear Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
};
