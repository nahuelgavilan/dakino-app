import { ShoppingBag } from 'lucide-react';
import type { Purchase } from '@/types/models';
import { formatDistance } from 'date-fns';
import { es } from 'date-fns/locale';

interface RecentPurchasesProps {
  purchases: Purchase[];
}

const categoryColors: Record<string, string> = {
  'Alimentos': 'from-green-400 to-emerald-500',
  'Limpieza': 'from-blue-400 to-cyan-500',
  'Salud': 'from-red-400 to-pink-500',
  'Hogar': 'from-orange-400 to-amber-500',
  'Ropa': 'from-purple-400 to-violet-500',
  'Entretenimiento': 'from-yellow-400 to-orange-500',
  'Transporte': 'from-indigo-400 to-blue-500',
  'Tecnología': 'from-gray-400 to-slate-500',
};

export const RecentPurchases = ({ purchases }: RecentPurchasesProps) => {
  if (purchases.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag size={64} className="mx-auto text-neutral-300 mb-4" />
        <p className="text-neutral-500 text-lg">No hay compras recientes</p>
        <p className="text-neutral-400 text-sm mt-1">Agrega tu primera compra para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {purchases.map((purchase, index) => {
        const gradient = categoryColors[purchase.category?.name || ''] || 'from-gray-400 to-gray-500';

        return (
          <div
            key={purchase.id}
            className="group relative bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300"
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            {/* Category color bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b ${gradient}`} />

            <div className="flex items-center justify-between pl-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-neutral-800 truncate text-lg">
                  {purchase.product_name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {purchase.category && (
                    <>
                      <span className="text-sm text-neutral-500">
                        {purchase.category.name}
                      </span>
                      <span className="text-neutral-300">•</span>
                    </>
                  )}
                  <span className="text-sm text-neutral-400">
                    {formatDistance(new Date(purchase.purchase_date), new Date(), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
                {purchase.quantity && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {purchase.unit_type === 'unit'
                      ? `${purchase.quantity} unidades`
                      : `${purchase.quantity} kg`}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end ml-4">
                <span className="text-2xl font-black text-primary-500">
                  ${purchase.total_price.toFixed(2)}
                </span>
                {purchase.unit_price && (
                  <span className="text-xs text-neutral-400">
                    ${purchase.unit_price.toFixed(2)}/{purchase.unit_type === 'unit' ? 'u' : 'kg'}
                  </span>
                )}
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300 from-primary-500 to-secondary-500 pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};
