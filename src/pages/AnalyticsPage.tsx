import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { statisticsService } from '@/services/statistics.service';
import type { CategoryStats, TypeStats } from '@/services/statistics.service';
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
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar, ShoppingBag, Gift, Sparkles } from 'lucide-react';

const COLORS = ['#FF1744', '#0EA5E9', '#F59E0B', '#10B981', '#9333EA', '#EC4899', '#3B82F6', '#6366F1'];

export const AnalyticsPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStats | null>(null);
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

      const [stats, types] = await Promise.all([
        statisticsService.getCategoryStats(user.id, startDate, endDate),
        statisticsService.getTypeStats(user.id, startDate, endDate)
      ]);
      setCategoryStats(stats);
      setTypeStats(types);
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

        {/* Compra vs Dakino Stats */}
        {typeStats && (typeStats.compras.count > 0 || typeStats.dakinos.count > 0) && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={24} className="text-emerald-500" />
              <h2 className="text-2xl font-black text-neutral-900">
                Compras vs Dakinos
              </h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Compras Card */}
              <div className="bg-gradient-to-br from-primary-50 to-rose-50 dark:from-primary-900/20 dark:to-rose-900/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                    <ShoppingBag size={20} className="text-white" />
                  </div>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Compras</span>
                </div>
                <p className="text-3xl font-black text-primary-600">
                  ${typeStats.compras.total.toFixed(2)}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {typeStats.compras.count} {typeStats.compras.count === 1 ? 'compra' : 'compras'}
                </p>
              </div>

              {/* Dakinos Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Gift size={20} className="text-white" />
                  </div>
                  <span className="font-bold text-neutral-700 dark:text-neutral-300">Dakinos</span>
                </div>
                <p className="text-3xl font-black text-emerald-600">
                  ${typeStats.dakinos.total.toFixed(2)}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {typeStats.dakinos.count} {typeStats.dakinos.count === 1 ? 'regalo' : 'regalos'}
                </p>
              </div>
            </div>

            {/* Savings Summary */}
            {typeStats.dakinos.total > 0 && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Te has ahorrado</p>
                    <p className="text-4xl font-black">${typeStats.dakinos.total.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-100 text-sm font-medium">Del valor total</p>
                    <p className="text-3xl font-black">{typeStats.savingsPercentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${typeStats.savingsPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-emerald-100">
                  <span>Gastado: ${typeStats.compras.total.toFixed(2)}</span>
                  <span>Regalado: ${typeStats.dakinos.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Type Distribution */}
            <div className="mt-6">
              <h3 className="font-bold text-neutral-700 mb-3">Distribución</h3>
              <div className="flex gap-2">
                <div
                  className="h-4 bg-primary-500 rounded-full transition-all duration-500"
                  style={{ width: `${typeStats.totalValue > 0 ? (typeStats.compras.total / typeStats.totalValue) * 100 : 0}%` }}
                />
                <div
                  className="h-4 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${typeStats.totalValue > 0 ? (typeStats.dakinos.total / typeStats.totalValue) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                  Compras ({typeStats.totalValue > 0 ? ((typeStats.compras.total / typeStats.totalValue) * 100).toFixed(0) : 0}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Dakinos ({typeStats.totalValue > 0 ? ((typeStats.dakinos.total / typeStats.totalValue) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          </div>
        )}

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
