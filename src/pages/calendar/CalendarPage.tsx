import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseCalendar } from '@/components/calendar/PurchaseCalendar';
import { purchaseService } from '@/services/purchase.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import type { Purchase } from '@/types/models';
import { Calendar, ShoppingBag, Loader2, Store, Tag } from 'lucide-react';

export const CalendarPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadPurchases();
  }, [user]);

  const loadPurchases = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await purchaseService.getPurchases(user.id);
      setPurchases(data);
    } catch (err) {
      console.error('Error loading purchases:', err);
      showError('Error al cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  const selectedDatePurchases = selectedDate
    ? purchases.filter(p => p.purchase_date === selectedDate)
    : [];

  const selectedDateTotal = selectedDatePurchases.reduce((sum, p) => sum + p.total_price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-700/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
            <Calendar className="inline mr-2 mb-1" size={28} />
            Calendario de Compras
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <PurchaseCalendar
              purchases={purchases}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Selected Date Details - Takes 1 column */}
          <div>
            {selectedDate ? (
              <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl sticky top-24">
                {/* Date Header */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>

                  {selectedDatePurchases.length > 0 && (
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-4 text-white">
                      <p className="text-sm font-medium opacity-90">Total del día</p>
                      <p className="text-3xl font-black">${selectedDateTotal.toFixed(2)}</p>
                      <p className="text-sm opacity-90 mt-1">
                        {selectedDatePurchases.length} {selectedDatePurchases.length === 1 ? 'compra' : 'compras'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Purchases List */}
                {selectedDatePurchases.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {selectedDatePurchases.map((purchase) => (
                      <button
                        key={purchase.id}
                        onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
                        className="w-full text-left bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2xl p-4 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100">
                              {purchase.product_name}
                            </h4>
                            {purchase.category && (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                {purchase.category.icon} {purchase.category.name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-primary-600 dark:text-primary-400">
                              ${purchase.total_price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Additional info */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {purchase.store && (
                            <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 px-2 py-1 rounded-lg">
                              <Store size={12} className="text-neutral-500 dark:text-neutral-400" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {purchase.store.icon} {purchase.store.name}
                              </span>
                            </div>
                          )}

                          {purchase.unit_type === 'unit' && purchase.quantity && (
                            <div className="bg-white dark:bg-neutral-800 px-2 py-1 rounded-lg text-neutral-600 dark:text-neutral-400">
                              {purchase.quantity} unidad{purchase.quantity > 1 ? 'es' : ''}
                            </div>
                          )}

                          {purchase.unit_type === 'weight' && purchase.weight && (
                            <div className="bg-white dark:bg-neutral-800 px-2 py-1 rounded-lg text-neutral-600 dark:text-neutral-400">
                              {purchase.weight} kg
                            </div>
                          )}

                          {purchase.tags && purchase.tags.length > 0 && (
                            <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 px-2 py-1 rounded-lg">
                              <Tag size={12} className="text-neutral-500 dark:text-neutral-400" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                {purchase.tags.length}
                              </span>
                            </div>
                          )}
                        </div>

                        {purchase.notes && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 italic">
                            {purchase.notes}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                      No hay compras en esta fecha
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl">
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                    Selecciona una fecha en el calendario
                  </p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
                    Haz clic en un día para ver las compras
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
