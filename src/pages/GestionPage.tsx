import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ShoppingBag,
  Package,
  ListChecks,
  ChevronRight,
  Calendar,
  BarChart3,
  Settings,
  Store,
} from 'lucide-react';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/store/authStore';
import { purchaseService } from '@/services/purchase.service';
import { productService } from '@/services/product.service';
import { bundleService } from '@/services/bundle.service';
import type { Purchase, Product, Bundle } from '@/types/models';

type Tab = 'compras' | 'productos' | 'listas';

export const GestionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('compras');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [purchasesData, productsData, bundlesData] = await Promise.all([
        purchaseService.getRecentPurchases(user.id, 10),
        productService.getProducts(user.id),
        bundleService.getBundles(user.id),
      ]);
      setPurchases(purchasesData);
      setProducts(productsData);
      setBundles(bundlesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'compras' as Tab, label: 'Compras', icon: ShoppingBag, count: purchases.length },
    { id: 'productos' as Tab, label: 'Productos', icon: Package, count: products.length },
    { id: 'listas' as Tab, label: 'Listas', icon: ListChecks, count: bundles.length },
  ];

  const quickActions = [
    {
      label: 'Nueva Compra',
      icon: Plus,
      color: 'bg-gradient-to-br from-primary-500 to-pink-500',
      onClick: () => navigate(ROUTES.APP.PURCHASES_NEW),
    },
    {
      label: 'Calendario',
      icon: Calendar,
      color: 'bg-gradient-to-br from-purple-500 to-violet-500',
      onClick: () => navigate(ROUTES.APP.CALENDAR),
    },
    {
      label: 'Estadísticas',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-emerald-500 to-green-500',
      onClick: () => navigate(ROUTES.APP.ANALYTICS),
    },
  ];

  const settingsLinks = [
    { label: 'Categorías', icon: Settings, path: ROUTES.APP.CATEGORIES },
    { label: 'Tiendas', icon: Store, path: ROUTES.APP.STORES },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100">
            Gestión
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Compras, productos y listas
          </p>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`${action.color} flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium shadow-lg`}
              >
                <Icon size={20} />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* COMPRAS TAB */}
            {activeTab === 'compras' && (
              <div className="space-y-3">
                {purchases.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" size={48} />
                    <p className="text-neutral-500 dark:text-neutral-400">No hay compras registradas</p>
                    <button
                      onClick={() => navigate(ROUTES.APP.PURCHASES_NEW)}
                      className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium"
                    >
                      Registrar primera compra
                    </button>
                  </div>
                ) : (
                  purchases.map((purchase) => (
                    <button
                      key={purchase.id}
                      onClick={() => navigate(`/purchases/${purchase.id}`)}
                      className="w-full bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: purchase.category?.color + '20' }}
                      >
                        {purchase.category?.icon || '🛒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {purchase.product_name}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {formatDate(purchase.purchase_date)}
                          {purchase.store && ` • ${purchase.store.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                          {formatPrice(purchase.total_price)}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {purchase.unit_type === 'unit'
                            ? `${purchase.quantity} ud`
                            : `${purchase.weight} kg`}
                        </p>
                      </div>
                      <ChevronRight className="text-neutral-300" size={20} />
                    </button>
                  ))
                )}
                {purchases.length > 0 && (
                  <button
                    onClick={() => navigate(ROUTES.APP.PURCHASES)}
                    className="w-full py-3 text-center text-primary-500 font-medium"
                  >
                    Ver todas las compras
                  </button>
                )}
              </div>
            )}

            {/* PRODUCTOS TAB */}
            {activeTab === 'productos' && (
              <div className="space-y-3">
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" size={48} />
                    <p className="text-neutral-500 dark:text-neutral-400">No hay productos en tu catálogo</p>
                    <p className="text-sm text-neutral-400 mt-1">
                      Los productos se crean automáticamente al registrar compras
                    </p>
                  </div>
                ) : (
                  products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => navigate(ROUTES.APP.PRODUCTS)}
                      className="w-full bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: product.category?.color + '20' }}
                      >
                        {product.category?.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {product.category?.name || 'Sin categoría'}
                          {product.usage_count > 0 && ` • ${product.usage_count} compras`}
                        </p>
                      </div>
                      {product.default_price && (
                        <p className="font-medium text-neutral-600 dark:text-neutral-300">
                          {formatPrice(product.default_price)}
                        </p>
                      )}
                      <ChevronRight className="text-neutral-300" size={20} />
                    </button>
                  ))
                )}
                {products.length > 0 && (
                  <button
                    onClick={() => navigate(ROUTES.APP.PRODUCTS)}
                    className="w-full py-3 text-center text-primary-500 font-medium"
                  >
                    Gestionar productos
                  </button>
                )}
              </div>
            )}

            {/* LISTAS TAB */}
            {activeTab === 'listas' && (
              <div className="space-y-3">
                <button
                  onClick={() => navigate(ROUTES.APP.BUNDLES_NEW)}
                  className="w-full bg-gradient-to-r from-accent-500 to-orange-500 rounded-xl p-4 flex items-center gap-4 text-white shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Plus size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Crear nueva lista</p>
                    <p className="text-sm text-white/80">Agrupa productos para comprar rápido</p>
                  </div>
                </button>

                {bundles.length === 0 ? (
                  <div className="text-center py-8">
                    <ListChecks className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" size={48} />
                    <p className="text-neutral-500 dark:text-neutral-400">No hay listas creadas</p>
                  </div>
                ) : (
                  bundles.map((bundle) => (
                    <button
                      key={bundle.id}
                      onClick={() => navigate(`/bundles/${bundle.id}/edit`)}
                      className="w-full bg-white dark:bg-neutral-800 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: bundle.color + '20' }}
                      >
                        {bundle.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {bundle.name}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {bundle.items?.length || 0} productos
                          {bundle.usage_count > 0 && ` • Usado ${bundle.usage_count} veces`}
                        </p>
                      </div>
                      <ChevronRight className="text-neutral-300" size={20} />
                    </button>
                  ))
                )}
                {bundles.length > 0 && (
                  <button
                    onClick={() => navigate(ROUTES.APP.BUNDLES)}
                    className="w-full py-3 text-center text-primary-500 font-medium"
                  >
                    Ver todas las listas
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Settings Section */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 px-1">
          Configuración
        </h3>
        <div className="bg-white dark:bg-neutral-800 rounded-xl divide-y divide-neutral-100 dark:divide-neutral-700">
          {settingsLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <Icon size={20} className="text-neutral-400" />
                <span className="flex-1 text-neutral-900 dark:text-neutral-100">{link.label}</span>
                <ChevronRight size={20} className="text-neutral-300" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
