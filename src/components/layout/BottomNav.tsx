import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Archive, User, Plus, ShoppingCart, ListChecks, X, PackagePlus, ScanLine } from 'lucide-react';
import { ROUTES } from '@/router/routes';
import { bundleService } from '@/services/bundle.service';
import { useAuthStore } from '@/store/authStore';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import type { Bundle } from '@/types/models';

const navItems = [
  {
    path: ROUTES.APP.DASHBOARD,
    icon: Home,
    label: 'Inicio',
    gradient: 'from-primary-500 to-pink-500',
  },
  {
    path: ROUTES.APP.PRODUCTS,
    icon: Package,
    label: 'Catálogo',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    path: 'fab',
    icon: Plus,
    label: 'Comprar',
    gradient: 'from-primary-500 to-pink-500',
    isFab: true,
  },
  {
    path: ROUTES.APP.INVENTORY,
    icon: Archive,
    label: 'Inventario',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    path: ROUTES.APP.PROFILE,
    icon: User,
    label: 'Perfil',
    gradient: 'from-emerald-500 to-green-500',
  },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Load bundles when menu opens
  useEffect(() => {
    if (showMenu && user) {
      loadBundles();
    }
  }, [showMenu, user]);

  const loadBundles = async () => {
    if (!user) return;
    try {
      setLoadingBundles(true);
      const data = await bundleService.getBundles(user.id);
      setBundles(data.slice(0, 5)); // Show max 5 bundles
    } catch (error) {
      console.error('Error loading bundles:', error);
    } finally {
      setLoadingBundles(false);
    }
  };

  const handleFabClick = () => {
    setShowMenu(!showMenu);
  };

  const handleQuickPurchase = () => {
    setShowMenu(false);
    navigate(ROUTES.APP.PURCHASES_NEW);
  };

  const handleUseBundle = (bundleId: string) => {
    setShowMenu(false);
    navigate(`/bundles/${bundleId}/execute`);
  };

  const handleCreateBundle = () => {
    setShowMenu(false);
    navigate(ROUTES.APP.BUNDLES_NEW);
  };

  const handleViewAllBundles = () => {
    setShowMenu(false);
    navigate(ROUTES.APP.BUNDLES);
  };

  const handleCreateProduct = () => {
    setShowMenu(false);
    setShowCreateProduct(true);
  };

  const handleScanTicket = () => {
    setShowMenu(false);
    navigate(ROUTES.APP.PURCHASES_SCAN);
  };

  const handleProductCreated = () => {
    setShowCreateProduct(false);
  };

  return (
    <>
      {/* FAB Menu Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* FAB Menu */}
      {showMenu && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden max-w-md mx-auto">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                Nueva Compra
              </h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            {/* Options */}
            <div className="p-3">
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {/* Quick Purchase */}
                <button
                  onClick={handleQuickPurchase}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-primary-50 to-pink-50 dark:from-primary-900/20 dark:to-pink-900/20 hover:shadow-md transition-all text-center"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <ShoppingCart size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">Compra</p>
                    <p className="text-[10px] text-neutral-500">Manual</p>
                  </div>
                </button>

                {/* Scan Ticket */}
                <button
                  onClick={handleScanTicket}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 hover:shadow-md transition-all text-center"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ScanLine size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">Escanear</p>
                    <p className="text-[10px] text-neutral-500">Ticket IA</p>
                  </div>
                </button>

                {/* Create Product */}
                <button
                  onClick={handleCreateProduct}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-md transition-all text-center"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <PackagePlus size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100 text-xs">Producto</p>
                    <p className="text-[10px] text-neutral-500">Nuevo</p>
                  </div>
                </button>
              </div>

              {/* Divider */}
              <div className="my-2 flex items-center gap-3">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                <span className="text-xs text-neutral-400 font-medium">O USA UNA LISTA</span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
              </div>

              {/* Bundles */}
              {loadingBundles ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : bundles.length === 0 ? (
                <button
                  onClick={handleCreateBundle}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-700/30 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-600 rounded-xl flex items-center justify-center">
                    <Plus size={22} className="text-neutral-500 dark:text-neutral-400" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900 dark:text-neutral-100">Crear Lista</p>
                    <p className="text-sm text-neutral-500">Agrupa productos frecuentes</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-1">
                  {bundles.map((bundle) => (
                    <button
                      key={bundle.id}
                      onClick={() => handleUseBundle(bundle.id)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: bundle.color + '20' }}
                      >
                        {bundle.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {bundle.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {bundle.items?.length || 0} productos
                        </p>
                      </div>
                      <ListChecks size={18} className="text-neutral-400" />
                    </button>
                  ))}

                  {/* View All & Create */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleViewAllBundles}
                      className="flex-1 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                    >
                      Ver todas
                    </button>
                    <button
                      onClick={handleCreateBundle}
                      className="flex-1 py-2.5 text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors"
                    >
                      + Nueva lista
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-700/50 pb-safe transition-colors duration-200 safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto px-1">
          <div className="flex items-center justify-around py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;

              // Special FAB button in the center
              if (item.isFab) {
                return (
                  <button
                    key={item.path}
                    onClick={handleFabClick}
                    className="flex flex-col items-center gap-0.5 -mt-5"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 active:scale-95 transition-all ${showMenu ? 'rotate-45' : ''}`}>
                      <Icon size={26} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMenu(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[52px] rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'scale-105'
                        : 'opacity-70 hover:opacity-100 active:scale-95'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`p-2 rounded-xl transition-all duration-200 ${
                          isActive
                            ? `bg-gradient-to-br ${item.gradient} shadow-md`
                            : 'bg-transparent'
                        }`}
                      >
                        <Icon
                          size={20}
                          className={isActive ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      </div>
                      <span
                        className={`text-[9px] font-bold transition-all duration-200 leading-tight text-center ${
                          isActive
                            ? 'text-neutral-900 dark:text-neutral-100'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Create Product Modal */}
      <ProductFormModal
        isOpen={showCreateProduct}
        onClose={() => setShowCreateProduct(false)}
        onSuccess={handleProductCreated}
        product={null}
      />
    </>
  );
};
