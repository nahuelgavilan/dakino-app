import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPurchases } from '@/components/dashboard/RecentPurchases';
import { statisticsService } from '@/services/statistics.service';
import { purchaseService } from '@/services/purchase.service';
import { Purchase } from '@/types/models';
import { Spinner } from '@/components/common/Spinner';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    todayCount: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load stats in parallel
      const [todayStats, weekStats, monthStats, purchases] = await Promise.all([
        statisticsService.getDayStats(user.id),
        statisticsService.getWeekStats(user.id),
        statisticsService.getMonthStats(user.id),
        purchaseService.getRecentPurchases(user.id, 5),
      ]);

      setStats({
        today: todayStats.total,
        week: weekStats.total,
        month: monthStats.total,
        todayCount: todayStats.count,
      });

      setRecentPurchases(purchases);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-secondary-50/20 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-neutral-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
                Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'} 👋
              </h1>
              <p className="text-neutral-600 mt-1">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <button
              onClick={() => navigate('/purchases/new')}
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Hoy"
            value={stats.today}
            gradient="linear-gradient(135deg, #FF1744 0%, #F50057 100%)"
            delay={0}
          />
          <StatCard
            label="Esta Semana"
            value={stats.week}
            gradient="linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)"
            delay={100}
          />
          <StatCard
            label="Este Mes"
            value={stats.month}
            gradient="linear-gradient(135deg, #F59E0B 0%, #F97316 100%)"
            delay={200}
          />
        </div>

        {/* Quick Stats */}
        {stats.todayCount > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <p className="text-neutral-600">
              Llevas{' '}
              <span className="font-black text-2xl text-primary-500">{stats.todayCount}</span>{' '}
              {stats.todayCount === 1 ? 'compra' : 'compras'} hoy
            </p>
          </div>
        )}

        {/* Recent Purchases */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-neutral-900">
              Compras Recientes
            </h2>
            <button
              onClick={() => navigate('/purchases')}
              className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
            >
              Ver todas →
            </button>
          </div>

          <RecentPurchases purchases={recentPurchases} />
        </div>
      </div>
    </div>
  );
};
