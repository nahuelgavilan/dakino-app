import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bundleService } from '@/services/bundle.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Bundle } from '@/types/models';
import { Spinner } from '@/components/common/Spinner';
import { Plus, ShoppingCart, Star, Edit2, Trash2, Play } from 'lucide-react';

export const BundlesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [executingBundle, setExecutingBundle] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBundles();
    }
  }, [user]);

  const loadBundles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await bundleService.getBundles(user.id);
      setBundles(data);
    } catch (error) {
      console.error('Error loading bundles:', error);
      showError('Error al cargar los bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (bundleId: string, currentFavorite: boolean) => {
    try {
      await bundleService.toggleFavorite(bundleId, !currentFavorite);
      await loadBundles();
      success(currentFavorite ? 'Removido de favoritos' : 'Agregado a favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Error al actualizar favorito');
    }
  };

  const handleExecuteBundle = async (bundle: Bundle) => {
    if (!user) return;

    if (!confirm(`¿Registrar todas las compras de "${bundle.name}"?`)) return;

    try {
      setExecutingBundle(bundle.id);
      await bundleService.executeBundle(bundle.id, user.id);
      await loadBundles();
      success(`✨ ${bundle.items?.length || 0} compras registradas correctamente`);
    } catch (error) {
      console.error('Error executing bundle:', error);
      showError('Error al ejecutar el bundle');
    } finally {
      setExecutingBundle(null);
    }
  };

  const handleDeleteBundle = async (bundleId: string, bundleName: string) => {
    if (!confirm(`¿Eliminar "${bundleName}"?`)) return;

    try {
      await bundleService.deleteBundle(bundleId);
      await loadBundles();
      success('Bundle eliminado');
    } catch (error) {
      console.error('Error deleting bundle:', error);
      showError('Error al eliminar el bundle');
    }
  };

  const getTotalEstimated = (bundle: Bundle): number => {
    if (!bundle.items) return 0;
    return bundle.items.reduce((sum, item) => {
      const itemTotal = item.unit_type === 'unit'
        ? (item.quantity || 0) * (item.estimated_price || 0)
        : (item.weight || 0) * (item.estimated_price || 0);
      return sum + itemTotal;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-accent-50/20 to-primary-50/20 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-500 to-orange-600 text-white pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingCart size={32} />
            <h1 className="text-3xl font-black">Listas de Compras</h1>
          </div>
          <p className="text-orange-100">Crea bundles y registra compras en un solo click</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        {/* Add Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/bundles/new')}
            className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between border-2 border-dashed border-accent-300 hover:border-accent-500"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-accent-500 to-orange-600 rounded-xl">
                <Plus size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-black text-lg text-neutral-900">Crear Nuevo Bundle</p>
                <p className="text-sm text-neutral-500">Define una lista de compras predefinida</p>
              </div>
            </div>
            <div className="text-3xl">→</div>
          </button>
        </div>

        {/* Bundles List */}
        {bundles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl font-bold text-neutral-600 mb-2">
              No hay bundles creados
            </p>
            <p className="text-neutral-400 mb-6">
              Crea tu primera lista de compras predefinida
            </p>
            <button
              onClick={() => navigate('/bundles/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Crear Bundle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bundles.map((bundle) => {
              const totalEstimated = getTotalEstimated(bundle);
              const isExecuting = executingBundle === bundle.id;

              return (
                <div
                  key={bundle.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  {/* Color bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: bundle.color }}
                  />

                  <div className="pl-4 p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-3xl">{bundle.icon}</span>
                          <h3 className="font-black text-xl text-neutral-900">
                            {bundle.name}
                          </h3>
                          {bundle.is_favorite && (
                            <Star size={16} className="text-yellow-500" fill="currentColor" />
                          )}
                        </div>

                        {bundle.description && (
                          <p className="text-sm text-neutral-600 mb-3">
                            {bundle.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="text-neutral-600">
                            {bundle.items?.length || 0} productos
                          </span>
                          {bundle.usage_count > 0 && (
                            <>
                              <span className="text-neutral-300">•</span>
                              <span className="text-neutral-600">
                                Usado {bundle.usage_count} {bundle.usage_count === 1 ? 'vez' : 'veces'}
                              </span>
                            </>
                          )}
                          {totalEstimated > 0 && (
                            <>
                              <span className="text-neutral-300">•</span>
                              <span className="font-bold text-neutral-900">
                                Estimado: ${totalEstimated.toFixed(2)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleFavorite(bundle.id, bundle.is_favorite)}
                          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                          title={bundle.is_favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                        >
                          <Star
                            size={18}
                            className={bundle.is_favorite ? 'text-yellow-500' : 'text-neutral-400'}
                            fill={bundle.is_favorite ? 'currentColor' : 'none'}
                          />
                        </button>
                        <button
                          onClick={() => navigate(`/bundles/${bundle.id}/edit`)}
                          className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                          title="Editar bundle"
                        >
                          <Edit2 size={18} className="text-neutral-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteBundle(bundle.id, bundle.name)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                          title="Eliminar bundle"
                        >
                          <Trash2 size={18} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Execute Button */}
                    <button
                      onClick={() => handleExecuteBundle(bundle)}
                      disabled={isExecuting || !bundle.items || bundle.items.length === 0}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExecuting ? (
                        <>
                          <Spinner size="sm" />
                          Registrando compras...
                        </>
                      ) : (
                        <>
                          <Play size={20} />
                          Registrar Todas las Compras
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
