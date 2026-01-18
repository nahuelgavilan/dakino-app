import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Minus,
  Trash2,
  MapPin,
} from 'lucide-react';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { inventoryService } from '@/services/inventory.service';
import { Modal } from '@/components/common/Modal';
import type { InventoryItem, StorageLocation, InventoryStatus } from '@/types/models';

type FilterStatus = 'all' | InventoryStatus;

export const InventoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success: showSuccess, error: showError } = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  // Consumption modal
  const [consumeModal, setConsumeModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
    amount: string;
  }>({ isOpen: false, item: null, amount: '1' });

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
  }>({ isOpen: false, item: null });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedLocation, selectedStatus]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [locationsData, itemsData, expiring, lowStock] = await Promise.all([
        inventoryService.getStorageLocations(),
        inventoryService.getInventoryItems(user.id, {
          locationId: selectedLocation || undefined,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
        }),
        inventoryService.getExpiringItems(user.id, 7),
        inventoryService.getLowStockItems(user.id),
      ]);
      setLocations(locationsData);
      setItems(itemsData);
      setExpiringItems(expiring);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!consumeModal.item) return;
    const amount = parseFloat(consumeModal.amount);
    if (isNaN(amount) || amount <= 0) {
      showError('Cantidad inválida');
      return;
    }

    try {
      await inventoryService.consumeItem(consumeModal.item.id, amount);
      showSuccess('Consumo registrado');
      setConsumeModal({ isOpen: false, item: null, amount: '1' });
      loadData();
    } catch (error) {
      console.error('Error consuming item:', error);
      showError('Error al registrar consumo');
    }
  };

  const handleMarkFinished = async (item: InventoryItem) => {
    try {
      await inventoryService.markAsFinished(item.id);
      showSuccess(`${item.product_name} marcado como terminado`);
      loadData();
    } catch (error) {
      console.error('Error marking as finished:', error);
      showError('Error al marcar como terminado');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await inventoryService.deleteInventoryItem(deleteModal.item.id);
      showSuccess('Item eliminado');
      setDeleteModal({ isOpen: false, item: null });
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Error al eliminar');
    }
  };

  const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
      case 'in_stock':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'low':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'empty':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: InventoryStatus) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle2 size={14} />;
      case 'low':
        return <AlertTriangle size={14} />;
      case 'empty':
        return <XCircle size={14} />;
    }
  };

  const getStatusLabel = (status: InventoryStatus) => {
    switch (status) {
      case 'in_stock':
        return 'En stock';
      case 'low':
        return 'Bajo';
      case 'empty':
        return 'Vacío';
    }
  };

  const getDaysUntilExpiration = (date: string) => {
    const expDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationLabel = (date: string) => {
    const days = getDaysUntilExpiration(date);
    if (days < 0) return { text: 'Caducado', color: 'text-red-500' };
    if (days === 0) return { text: 'Caduca hoy', color: 'text-red-500' };
    if (days === 1) return { text: 'Caduca mañana', color: 'text-amber-500' };
    if (days <= 7) return { text: `Caduca en ${days} días`, color: 'text-amber-500' };
    return { text: `Caduca en ${days} días`, color: 'text-neutral-500' };
  };

  const statusFilters: { value: FilterStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Todos', icon: <Package size={16} /> },
    { value: 'in_stock', label: 'En stock', icon: <CheckCircle2 size={16} /> },
    { value: 'low', label: 'Bajo', icon: <AlertTriangle size={16} /> },
    { value: 'empty', label: 'Vacío', icon: <XCircle size={16} /> },
  ];

  const filteredItems = items.filter((item) => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100">
                Inventario
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {items.filter((i) => i.status !== 'empty').length} items en casa
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.APP.PURCHASES_NEW)}
              className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/25"
            >
              <Plus size={22} />
            </button>
          </div>
        </div>

        {/* Location Filter */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedLocation(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              selectedLocation === null
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <MapPin size={16} />
            Todas
          </button>
          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => setSelectedLocation(location.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                selectedLocation === location.id
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <span>{location.icon}</span>
              {location.name}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="px-4 pb-3 flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`flex-1 py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1 ${
                selectedStatus === filter.value
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {(expiringItems.length > 0 || lowStockItems.length > 0) && selectedStatus === 'all' && !selectedLocation && (
        <div className="px-4 py-4 space-y-3">
          {expiringItems.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                <Clock size={18} />
                <span>Por caducar ({expiringItems.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {expiringItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 bg-white dark:bg-neutral-800 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {item.product_name}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 ml-2">
                      {getExpirationLabel(item.expiration_date!).text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-2">
                <AlertTriangle size={18} />
                <span>Stock bajo ({lowStockItems.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 bg-white dark:bg-neutral-800 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {item.product_name}
                    </span>
                    <span className="text-red-600 dark:text-red-400 ml-2">
                      {item.current_quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="px-4 py-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" size={48} />
            <p className="text-neutral-500 dark:text-neutral-400">
              {selectedStatus !== 'all' || selectedLocation
                ? 'No hay items con estos filtros'
                : 'Tu inventario está vacío'}
            </p>
            <p className="text-sm text-neutral-400 mt-1">
              Registra una compra para agregar items al inventario
            </p>
            <button
              onClick={() => navigate(ROUTES.APP.PURCHASES_NEW)}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium"
            >
              Nueva compra
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: item.category?.color + '20' }}
                  >
                    {item.category?.icon || '📦'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {item.product_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {getStatusIcon(item.status)}
                            {getStatusLabel(item.status)}
                          </span>
                          {item.location && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                              {item.location.icon} {item.location.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                          {item.current_quantity}
                          <span className="text-sm font-normal text-neutral-500 ml-1">
                            {item.unit}
                          </span>
                        </p>
                        {item.expiration_date && (
                          <p className={`text-xs ${getExpirationLabel(item.expiration_date).color}`}>
                            {getExpirationLabel(item.expiration_date).text}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {item.status !== 'empty' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() =>
                            setConsumeModal({ isOpen: true, item, amount: '1' })
                          }
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <Minus size={16} />
                          Usar
                        </button>
                        <button
                          onClick={() => handleMarkFinished(item)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                          <XCircle size={16} />
                          Terminado
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, item })}
                          className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consume Modal */}
      <Modal
        isOpen={consumeModal.isOpen}
        onClose={() => setConsumeModal({ isOpen: false, item: null, amount: '1' })}
        title={`Usar ${consumeModal.item?.product_name || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Cantidad a usar ({consumeModal.item?.unit || 'unidades'})
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const current = parseFloat(consumeModal.amount) || 0;
                  if (current > 1) {
                    setConsumeModal((prev) => ({
                      ...prev,
                      amount: String(current - 1),
                    }));
                  }
                }}
                className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 font-bold text-xl"
              >
                -
              </button>
              <input
                type="number"
                value={consumeModal.amount}
                onChange={(e) =>
                  setConsumeModal((prev) => ({ ...prev, amount: e.target.value }))
                }
                className="flex-1 h-12 text-center text-xl font-bold bg-neutral-100 dark:bg-neutral-700 rounded-xl border-0 text-neutral-900 dark:text-neutral-100"
                min="0"
                step="0.1"
              />
              <button
                onClick={() => {
                  const current = parseFloat(consumeModal.amount) || 0;
                  const max = consumeModal.item?.current_quantity || 0;
                  if (current < max) {
                    setConsumeModal((prev) => ({
                      ...prev,
                      amount: String(current + 1),
                    }));
                  }
                }}
                className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-300 font-bold text-xl"
              >
                +
              </button>
            </div>
            <p className="text-sm text-neutral-500 mt-2 text-center">
              Disponible: {consumeModal.item?.current_quantity || 0} {consumeModal.item?.unit}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setConsumeModal({ isOpen: false, item: null, amount: '1' })}
              className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl font-medium text-neutral-700 dark:text-neutral-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleConsume}
              className="flex-1 py-3 bg-primary-500 rounded-xl font-medium text-white"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        title="Eliminar item"
      >
        <div className="space-y-4">
          <p className="text-neutral-600 dark:text-neutral-400">
            ¿Estás seguro de eliminar <strong>{deleteModal.item?.product_name}</strong> del inventario?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModal({ isOpen: false, item: null })}
              className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl font-medium text-neutral-700 dark:text-neutral-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 bg-red-500 rounded-xl font-medium text-white"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
