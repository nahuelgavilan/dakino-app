import { useState } from 'react';
import type { Bundle, BundleItem } from '@/types/models';
import { X, Calendar, DollarSign, Package, Scale, ShoppingBag } from 'lucide-react';

interface BundleItemAdjusted extends BundleItem {
  adjusted_quantity?: string;
  adjusted_weight?: string;
  adjusted_price?: string;
}

interface BundleExecutionModalProps {
  bundle: Bundle;
  onClose: () => void;
  onConfirm: (items: BundleItemAdjusted[], date: string) => void;
  isLoading?: boolean;
}

export const BundleExecutionModal = ({ bundle, onClose, onConfirm, isLoading }: BundleExecutionModalProps) => {
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<BundleItemAdjusted[]>(
    (bundle.items || []).map(item => ({
      ...item,
      adjusted_quantity: item.quantity?.toString() || '',
      adjusted_weight: item.weight?.toString() || '',
      adjusted_price: item.estimated_price?.toString() || '',
    }))
  );

  const updateItem = (index: number, field: keyof BundleItemAdjusted, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateItemTotal = (item: BundleItemAdjusted): number => {
    const price = parseFloat(item.adjusted_price || '0');
    if (item.unit_type === 'unit') {
      const quantity = parseFloat(item.adjusted_quantity || '0');
      return quantity * price;
    } else {
      const weight = parseFloat(item.adjusted_weight || '0');
      return weight * price;
    }
  };

  const grandTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  const handleConfirm = () => {
    onConfirm(items, purchaseDate);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span className="text-3xl">{bundle.icon}</span>
                Revisar Compras
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {bundle.name} • {items.length} productos
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>
          </div>

          {/* Date Selector */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Fecha de Compra
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-neutral-200 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 rounded-xl focus:border-primary-500 focus:outline-none text-sm font-medium transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {items.map((item, index) => {
              const itemTotal = calculateItemTotal(item);

              return (
                <div
                  key={item.id}
                  className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border-2 border-neutral-100 dark:border-neutral-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-neutral-900 dark:text-neutral-100">
                        {item.product_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {item.category_id && (
                          <span>Categoría guardada</span>
                        )}
                        {item.store_id && (
                          <>
                            <span>•</span>
                            <span>Tienda guardada</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-primary-600 dark:text-primary-400">
                        ${itemTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Quantity/Weight */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        {item.unit_type === 'unit' ? (
                          <span className="flex items-center gap-1">
                            <Package size={14} />
                            Cantidad
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Scale size={14} />
                            Peso (kg)
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step={item.unit_type === 'weight' ? '0.001' : '1'}
                        value={item.unit_type === 'unit' ? item.adjusted_quantity : item.adjusted_weight}
                        onChange={(e) => updateItem(
                          index,
                          item.unit_type === 'unit' ? 'adjusted_quantity' : 'adjusted_weight',
                          e.target.value
                        )}
                        className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 rounded-lg text-sm font-medium focus:border-primary-500 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {item.unit_type === 'unit' ? 'Precio Unit.' : 'Precio/kg'}
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.adjusted_price}
                        onChange={(e) => updateItem(index, 'adjusted_price', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 rounded-lg text-sm font-medium focus:border-primary-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with Total and Actions */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
          <div className="mb-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Total Estimado</p>
                <p className="text-3xl font-black">${grandTotal.toFixed(2)}</p>
              </div>
              <ShoppingBag size={32} className="opacity-50" />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registrando...' : `Registrar ${items.length} Compras`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
