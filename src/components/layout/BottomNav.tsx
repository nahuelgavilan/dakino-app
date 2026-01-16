import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Package, ShoppingCart, Calendar, User } from 'lucide-react';
import { ROUTES } from '@/router/routes';

const navItems = [
  {
    path: ROUTES.APP.DASHBOARD,
    icon: Home,
    label: 'Inicio',
    gradient: 'from-primary-500 to-pink-500',
  },
  {
    path: ROUTES.APP.PURCHASES,
    icon: ShoppingBag,
    label: 'Compras',
    gradient: 'from-secondary-500 to-cyan-500',
  },
  {
    path: ROUTES.APP.PRODUCTS,
    icon: Package,
    label: 'Productos',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    path: ROUTES.APP.BUNDLES,
    icon: ShoppingCart,
    label: 'Listas',
    gradient: 'from-accent-500 to-orange-600',
  },
  {
    path: ROUTES.APP.CALENDAR,
    icon: Calendar,
    label: 'Calendario',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    path: ROUTES.APP.PROFILE,
    icon: User,
    label: 'Perfil',
    gradient: 'from-emerald-500 to-green-500',
  },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-700/50 pb-safe transition-colors duration-200 safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto px-0.5">
        <div className="flex items-center justify-around py-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-1 py-2 min-w-[50px] rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'scale-105'
                      : 'opacity-70 hover:opacity-100 active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-br ${item.gradient} shadow-lg`
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
