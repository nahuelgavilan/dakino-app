import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Package, Archive, User, Plus } from 'lucide-react';
import { ROUTES } from '@/router/routes';

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
    path: 'fab', // Special case for FAB
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

  return (
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
                  onClick={() => navigate(ROUTES.APP.PURCHASES_NEW)}
                  className="flex flex-col items-center gap-0.5 -mt-5"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 active:scale-95 transition-transform">
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
  );
};
