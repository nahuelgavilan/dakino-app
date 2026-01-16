import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '@/services/category.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Category } from '@/types/models';
import { X, Plus, Trash2, Edit2, Tag as TagIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

export const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    color: '#10B981',
  });

  const colorOptions = [
    { name: 'Verde', value: '#10B981' },
    { name: 'Azul', value: '#0EA5E9' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Ámbar', value: '#F59E0B' },
    { name: 'Morado', value: '#9333EA' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Azul claro', value: '#3B82F6' },
    { name: 'Naranja', value: '#F97316' },
  ];

  const iconOptions = ['📦', '🍎', '🧹', '💊', '🏠', '👕', '🎮', '🚗', '📱', '🍕', '🥤', '🎨', '⚽', '📚', '💰', '🎁'];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await categoryService.getCategories(user.id);
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      showError('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      showError('El nombre es requerido');
      return;
    }

    try {
      if (editingId) {
        await categoryService.updateCategory(editingId, formData);
        success('Categoría actualizada');
      } else {
        await categoryService.createCategory({
          user_id: user.id,
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          is_default: false,
        });
        success('✨ Categoría creada');
      }

      resetForm();
      loadCategories();
    } catch (err: any) {
      console.error('Error saving category:', err);
      showError(err.message || 'Error al guardar categoría');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      icon: category.icon || '📦',
      color: category.color || '#10B981',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Las compras asociadas NO se eliminarán.')) return;

    try {
      await categoryService.deleteCategory(id);
      success('Categoría eliminada');
      loadCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      showError(err.message || 'Error al eliminar categoría');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', icon: '📦', color: '#10B981' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-700/50 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
              Mis Categorías
            </h1>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
            >
              <X size={24} className="text-neutral-900 dark:text-neutral-100" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-6 p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Plus size={24} />
          {showForm ? 'Cancelar' : 'Agregar Categoría'}
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl mb-6 space-y-4">
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Bebidas, Snacks, Mascotas..."
              required
            />

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Icono
              </label>
              <div className="grid grid-cols-8 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`text-3xl p-3 rounded-xl border-2 transition-all ${
                      formData.icon === icon
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      formData.color === option.value
                        ? 'border-neutral-900 dark:border-neutral-100 scale-105'
                        : 'border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: option.value }}
                    />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{option.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={resetForm} fullWidth>
                Cancelar
              </Button>
              <Button type="submit" fullWidth>
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-lg flex items-center gap-4 group hover:shadow-xl transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: category.color + '20' }}
              >
                {category.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 truncate">
                  {category.name}
                </h3>
                {category.is_default && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Por defecto</span>
                )}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <TagIcon size={64} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
            <p className="text-neutral-600 dark:text-neutral-400 font-medium text-lg">
              No tienes categorías aún
            </p>
            <p className="text-neutral-500 dark:text-neutral-500 mt-2">
              Crea tu primera categoría para organizar tus compras
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
