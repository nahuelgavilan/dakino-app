import { useAuth } from '@/hooks/useAuth';

export const DashboardPage = () => {
  const { profile } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-6">
        Dashboard
      </h1>
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <p className="text-lg text-neutral-700">
          Bienvenido, <span className="font-semibold text-primary-500">{profile?.full_name || 'Usuario'}</span>
        </p>
        <p className="text-neutral-600 mt-2">
          El dashboard completo con estadísticas se implementará próximamente.
        </p>
      </div>
    </div>
  );
};
