import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { useAuthStore } from '@/store/authStore';
import { Product, Category, ProductInsert } from '@/types/models';
import { Package, DollarSign } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

export const ProductFormModal = ({ isOpen, onClose, onSuccess, product }: ProductFormModalProps) => {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    unit_type: 'unit' as 'unit' | 'weight',
    default_price: '',
    default_unit: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (product) {
        setFormData({
          name: product.name,
          category_id: product.category_id || '',
          unit_type: product.unit_type,
          default_price: product.default_price?.toString() || '',
          default_unit: product.default_unit || '',
        });
      } else {
        setFormData({
          name: '',
          category_id: '',
          unit_type: 'unit',
          default_price: '',
          default_unit: '',
        });
      }
    }
  }, [isOpen, product]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const productData: ProductInsert = {
        user_id: user.id,
        name: formData.name,
        category_id: formData.category_id || null,
        unit_type: formData.unit_type,
        default_price: formData.default_price ? parseFloat(formData.default_price) : null,
        default_unit: formData.default_unit || null,
        image_url: null,
      };

      if (product) {
        await productService.updateProduct(product.id, productData);
      } else {
        await productService.createProduct(productData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Editar Producto' : 'Nuevo Producto'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Nombre del producto
          </label>
          <div className="relative">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Manzanas Fuji"
              required
              className="w-full pl-12 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Unit Type Toggle */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-3">
            Tipo de producto
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, unit_type: 'unit' })}
              className={`p-4 rounded-xl font-bold transition-all duration-200 ${
                formData.unit_type === 'unit'
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              📦 Por Unidad
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, unit_type: 'weight' })}
              className={`p-4 rounded-xl font-bold transition-all duration-200 ${
                formData.unit_type === 'weight'
                  ? 'bg-gradient-to-r from-secondary-500 to-cyan-500 text-white shadow-lg scale-105'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              ⚖️ Por Peso/Granel
            </button>
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Categoría
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Default Price */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Precio por defecto {formData.unit_type === 'weight' && '(por kg/litro)'}
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
          <p className="text-xs text-neutral-500 mt-1">
            Opcional - se pre-rellenará al registrar compra
          </p>
        </div>

        {/* Default Unit (for weight type) */}
        {formData.unit_type === 'weight' && (
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Unidad de medida
            </label>
            <input
              type="text"
              value={formData.default_unit}
              onChange={(e) => setFormData({ ...formData, default_unit: e.target.value })}
              placeholder="kg, litros, gramos..."
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : product ? 'Actualizar' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
