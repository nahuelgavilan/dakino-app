import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/router/routes';
import { Home, ShoppingBag, Package, User, LogOut } from 'lucide-react';
import clsx from 'clsx';

export const AppLayout = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate(ROUTES.AUTH.LOGIN);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { path: ROUTES.APP.DASHBOARD, label: 'Dashboard', icon: Home },
    { path: ROUTES.APP.PURCHASES, label: 'Compras', icon: ShoppingBag },
    { path: ROUTES.APP.PRODUCTS, label: 'Productos', icon: Package },
    { path: ROUTES.APP.PROFILE, label: 'Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={ROUTES.APP.DASHBOARD} className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Dakino
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600 hidden md:block">
              {profile?.full_name || profile?.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} className="text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-20 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={clsx(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                {
                  'text-primary-500': location.pathname === path,
                  'text-neutral-600 hover:text-neutral-900': location.pathname !== path,
                }
              )}
            >
              <Icon size={24} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Sidebar (Desktop) - TODO: Implement full sidebar */}
    </div>
  );
};
