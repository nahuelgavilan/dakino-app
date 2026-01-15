import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Package, User } from 'lucide-react';
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
    gradient: 'from-accent-500 to-orange-500',
  },
  {
    path: ROUTES.APP.PROFILE,
    icon: User,
    label: 'Perfil',
    gradient: 'from-purple-500 to-violet-500',
  },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-neutral-200/50 pb-safe">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-6 py-3 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? 'scale-110'
                      : 'opacity-60 hover:opacity-100 active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon
                        size={24}
                        className={isActive ? 'text-white' : 'text-neutral-600'}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'text-neutral-900'
                          : 'text-neutral-500'
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
