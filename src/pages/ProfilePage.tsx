import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Mail, Calendar, Package, ShoppingBag, Tag, Store, ChevronRight, Settings, ListChecks, History, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProfilePage = () => {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user || !profile) {
    return null;
  }

  const userInitials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/20 to-primary-50/20 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white pt-8 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-black mb-2">Mi Perfil</h1>
          <p className="text-purple-100">Información de tu cuenta</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black mb-4 shadow-lg">
              {userInitials}
            </div>

            <h2 className="text-2xl font-black text-neutral-900 mb-1">
              {profile.full_name || 'Usuario'}
            </h2>
            <p className="text-neutral-500 text-sm">{profile.email}</p>
          </div>

          {/* User Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 font-semibold">Nombre completo</p>
                <p className="text-neutral-900 font-bold">
                  {profile.full_name || 'No especificado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 font-semibold">Email</p>
                <p className="text-neutral-900 font-bold">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-neutral-500 font-semibold">Miembro desde</p>
                <p className="text-neutral-900 font-bold">
                  {format(new Date(profile.created_at), "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-sm font-black text-neutral-700 uppercase tracking-wide mb-3">
              Acceso Rápido
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/bundles')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ListChecks size={20} className="text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-900">Mis Listas</p>
                    <p className="text-xs text-neutral-600">Listas de compra predefinidas</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/purchases')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <History size={20} className="text-pink-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-900">Historial de Compras</p>
                    <p className="text-xs text-neutral-600">Ver todas tus compras</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 size={20} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-900">Estadísticas</p>
                    <p className="text-xs text-neutral-600">Ver análisis de gastos</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Settings Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={18} className="text-neutral-600" />
              <h3 className="text-sm font-black text-neutral-700 uppercase tracking-wide">
                Configuración
              </h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/categories')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag size={20} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-900">Mis Categorías</p>
                    <p className="text-xs text-neutral-600">Gestionar categorías de productos</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/stores')}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl hover:shadow-md transition-all active:scale-98 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Store size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-900">Mis Tiendas</p>
                    <p className="text-xs text-neutral-600">Gestionar supermercados y tiendas</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ShoppingBag size={20} className="text-primary-600" />
              </div>
              <p className="text-sm text-neutral-600 font-semibold">Compras</p>
            </div>
            <p className="text-3xl font-black text-neutral-900">-</p>
            <p className="text-xs text-neutral-400 mt-1">Total registradas</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent-100 rounded-lg">
                <Package size={20} className="text-accent-600" />
              </div>
              <p className="text-sm text-neutral-600 font-semibold">Productos</p>
            </div>
            <p className="text-3xl font-black text-neutral-900">-</p>
            <p className="text-xs text-neutral-400 mt-1">En el catálogo</p>
          </div>
        </div>

      </div>
    </div>
  );
};
