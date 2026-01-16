import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeService } from '@/services/store.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Store } from '@/types/models';
import { X, Plus, Trash2, Edit2, Store as StoreIcon, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

export const StoreManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    icon: '🏪',
    color: '#0EA5E9',
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

  const iconOptions = ['🏪', '🛒', '🏬', '🏭', '🏢', '🛍️', '🏪', '🏬', '🍎', '🥖', '🍞', '🥩', '🐟', '☕', '🍺', '🎯'];

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await storeService.getStores(user.id);
      setStores(data);
    } catch (err) {
      console.error('Error loading stores:', err);
      showError('Error al cargar tiendas');
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
        await storeService.updateStore(editingId, formData);
        success('Tienda actualizada');
      } else {
        await storeService.createStore({
          user_id: user.id,
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          is_favorite: false,
        });
        success('✨ Tienda creada');
      }

      resetForm();
      loadStores();
    } catch (err: any) {
      console.error('Error saving store:', err);

      // Manejo de errores específicos
      let errorMessage = 'Error al guardar tienda';

      if (err.message) {
        if (err.message.includes('duplicate key') || err.message.includes('unique constraint')) {
          errorMessage = 'Ya existe una tienda con ese nombre';
        } else if (err.message.includes('permission denied') || err.message.includes('policy')) {
          errorMessage = 'Error de permisos. Verifica tu sesión';
        } else if (err.message.includes('relation') || err.message.includes('does not exist')) {
          errorMessage = 'Error de base de datos. Ejecuta la migración de tiendas';
        } else {
          errorMessage = err.message;
        }
      }

      showError(errorMessage);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingId(store.id);
    setFormData({
      name: store.name,
      icon: store.icon || '🏪',
      color: store.color || '#0EA5E9',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tienda? Las compras asociadas NO se eliminarán.')) return;

    try {
      await storeService.deleteStore(id);
      success('Tienda eliminada');
      loadStores();
    } catch (err: any) {
      console.error('Error deleting store:', err);
      showError(err.message || 'Error al eliminar tienda');
    }
  };

  const handleToggleFavorite = async (store: Store) => {
    try {
      await storeService.toggleFavorite(store.id, !store.is_favorite);
      loadStores();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      showError('Error al actualizar favorito');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', icon: '🏪', color: '#0EA5E9' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Cargando tiendas...</p>
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
              Mis Tiendas
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
          {showForm ? 'Cancelar' : 'Agregar Tienda'}
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl mb-6 space-y-4">
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Supermercado local, Frutería..."
              required
            />

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                Icono
              </label>
              <div className="grid grid-cols-8 gap-2">
                {iconOptions.map((icon, index) => (
                  <button
                    key={`${icon}-${index}`}
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

        {/* Stores List */}
        <div className="space-y-3">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-lg flex items-center gap-4 group hover:shadow-xl transition-all"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: store.color + '20' }}
              >
                {store.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-2">
                  {store.name}
                  {store.is_favorite && (
                    <Star size={16} className="text-accent-500 fill-accent-500" />
                  )}
                </h3>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggleFavorite(store)}
                  className={`p-2 rounded-lg transition-colors ${
                    store.is_favorite
                      ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400'
                  }`}
                  title={store.is_favorite ? 'Quitar de favoritos' : 'Marcar como favorita'}
                >
                  <Star size={20} className={store.is_favorite ? 'fill-current' : ''} />
                </button>
                <button
                  onClick={() => handleEdit(store)}
                  className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg transition-colors"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(store.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="text-center py-12">
            <StoreIcon size={64} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
            <p className="text-neutral-600 dark:text-neutral-400 font-medium text-lg">
              No tienes tiendas aún
            </p>
            <p className="text-neutral-500 dark:text-neutral-500 mt-2">
              Crea tu primera tienda para registrar dónde compras
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
