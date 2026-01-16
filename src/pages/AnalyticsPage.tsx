import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { statisticsService } from '@/services/statistics.service';
import type { CategoryStats } from '@/services/statistics.service';
import { Spinner } from '@/components/common/Spinner';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';

const COLORS = ['#FF1744', '#0EA5E9', '#F59E0B', '#10B981', '#9333EA', '#EC4899', '#3B82F6', '#6366F1'];

export const AnalyticsPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, selectedPeriod]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const endDate = new Date();
      const startDate = new Date();

      if (selectedPeriod === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const stats = await statisticsService.getCategoryStats(user.id, startDate, endDate);
      setCategoryStats(stats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = categoryStats.map((stat) => ({
    name: stat.category_name,
    value: stat.total,
    icon: stat.category_icon,
  }));

  const barData = categoryStats.map((stat) => ({
    name: stat.category_name.length > 10 ? stat.category_name.substring(0, 10) + '...' : stat.category_name,
    fullName: stat.category_name,
    total: stat.total,
    count: stat.count,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/20 to-primary-50/20 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={32} />
            <h1 className="text-3xl font-black">Análisis y Estadísticas</h1>
          </div>
          <p className="text-purple-100">Visualiza tus patrones de gasto</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        {/* Period Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={20} className="text-neutral-600" />
            <p className="text-sm font-bold text-neutral-700">Período de análisis</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  selectedPeriod === period
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>

        {categoryStats.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl font-bold text-neutral-600 mb-2">
              No hay datos para este período
            </p>
            <p className="text-neutral-400">Registra algunas compras para ver tus estadísticas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pie Chart - Distribution */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon size={24} className="text-purple-500" />
                <h2 className="text-2xl font-black text-neutral-900">
                  Distribución por Categoría
                </h2>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) =>
                      `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `$${(value as number).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #f0f0f0',
                      borderRadius: '12px',
                      padding: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Total by Category */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={24} className="text-primary-500" />
                <h2 className="text-2xl font-black text-neutral-900">
                  Gasto por Categoría
                </h2>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => `$${(value as number).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #f0f0f0',
                      borderRadius: '12px',
                      padding: '12px',
                    }}
                  />
                  <Bar dataKey="total" fill="#FF1744" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Cards */}
            <div>
              <h2 className="text-2xl font-black text-neutral-900 mb-4">
                Desglose Detallado
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryStats.map((stat, index) => (
                  <div
                    key={stat.category_id || 'uncategorized'}
                    className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden"
                  >
                    {/* Color bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />

                    <div className="pl-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {stat.category_icon && (
                            <span className="text-2xl">{stat.category_icon}</span>
                          )}
                          <h3 className="font-black text-lg text-neutral-900">
                            {stat.category_name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black text-primary-500">
                            ${stat.total.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">
                          {stat.count} {stat.count === 1 ? 'compra' : 'compras'}
                        </span>
                        <span className="font-bold text-neutral-900">
                          {stat.percentage.toFixed(1)}% del total
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${stat.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
