import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { productService } from '@/services/product.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Product, Category, Store } from '@/types/models';
import { Package, DollarSign } from 'lucide-react';

interface QuickProductCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
  categories: Category[];
  stores: Store[];
  initialName?: string;
  initialUnitType?: 'unit' | 'weight';
}

export const QuickProductCreate = ({
  isOpen,
  onClose,
  onProductCreated,
  categories,
  stores,
  initialName = '',
  initialUnitType = 'unit',
}: QuickProductCreateProps) => {
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: initialName,
    category_id: '',
    store_id: '',
    unit_type: initialUnitType,
    default_price: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim() || !formData.category_id) {
      showError('Nombre y categoría son requeridos');
      return;
    }

    try {
      setLoading(true);

      const newProduct = await productService.createProduct({
        user_id: user.id,
        name: formData.name.trim(),
        category_id: formData.category_id,
        store_id: formData.store_id || null,
        unit_type: formData.unit_type,
        default_price: formData.default_price ? parseFloat(formData.default_price) : null,
        default_unit: null,
        image_url: null,
      });

      success('Producto creado');
      onProductCreated(newProduct);
      onClose();

      // Reset form
      setFormData({
        name: '',
        category_id: '',
        store_id: '',
        unit_type: 'unit',
        default_price: '',
      });
    } catch (err) {
      console.error('Error creating product:', err);
      showError('Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Producto Rápido"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Nombre del producto *
          </label>
          <div className="relative">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Leche Entera"
              required
              className="w-full pl-12 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Unit Type Toggle */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Tipo de producto
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, unit_type: 'unit' })}
              className={`p-3 rounded-xl font-bold transition-all ${
                formData.unit_type === 'unit'
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white shadow-lg'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              📦 Unidad
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, unit_type: 'weight' })}
              className={`p-3 rounded-xl font-bold transition-all ${
                formData.unit_type === 'weight'
                  ? 'bg-gradient-to-r from-secondary-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              ⚖️ Peso
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Categoría *
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            required
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Seleccionar...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Store (optional) */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Tienda (opcional)
          </label>
          <select
            value={formData.store_id}
            onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Sin tienda específica...</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.icon} {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* Default Price (optional) */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Precio por defecto (opcional)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="number"
              step="0.01"
              value={formData.default_price}
              onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
              placeholder="0.00"
              className="w-full pl-12 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
