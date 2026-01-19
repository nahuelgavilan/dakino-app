import { supabase } from './supabase';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface PeriodStats {
  total: number;
  count: number;
  average: number;
}

export interface TypeStats {
  compras: { total: number; count: number };
  dakinos: { total: number; count: number };
  totalValue: number;
  savingsPercentage: number;
}

export interface CategoryStats {
  category_id: string | null;
  category_name: string;
  category_icon: string | null;
  category_color: string | null;
  total: number;
  count: number;
  percentage: number;
}

export class StatisticsService {
  async getDayStats(userId: string, date: Date = new Date()): Promise<PeriodStats> {
    const start = startOfDay(date).toISOString().split('T')[0];
    const end = endOfDay(date).toISOString().split('T')[0];

    return this.getStatsForPeriod(userId, start, end);
  }

  async getWeekStats(userId: string, date: Date = new Date()): Promise<PeriodStats> {
    const start = startOfWeek(date, { weekStartsOn: 1 }).toISOString().split('T')[0];
    const end = endOfWeek(date, { weekStartsOn: 1 }).toISOString().split('T')[0];

    return this.getStatsForPeriod(userId, start, end);
  }

  async getMonthStats(userId: string, date: Date = new Date()): Promise<PeriodStats> {
    const start = startOfMonth(date).toISOString().split('T')[0];
    const end = endOfMonth(date).toISOString().split('T')[0];

    return this.getStatsForPeriod(userId, start, end);
  }

  async getYearStats(userId: string, date: Date = new Date()): Promise<PeriodStats> {
    const start = startOfYear(date).toISOString().split('T')[0];
    const end = endOfYear(date).toISOString().split('T')[0];

    return this.getStatsForPeriod(userId, start, end);
  }

  private async getStatsForPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<PeriodStats> {
    const { data, error } = await supabase
      .from('purchases')
      .select('total_price')
      .eq('user_id', userId)
      .gte('purchase_date', startDate)
      .lte('purchase_date', endDate);

    if (error) throw error;

    const count = data.length;
    const total = data.reduce((sum, p) => sum + Number(p.total_price), 0);
    const average = count > 0 ? total / count : 0;

    return { total, count, average };
  }

  async getCategoryStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CategoryStats[]> {
    let query = supabase
      .from('purchases')
      .select(
        `
        total_price,
        category:categories(id, name, icon, color)
      `
      )
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('purchase_date', startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query = query.lte('purchase_date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Agrupar por categoría
    const categoryMap = new Map<string, {
      name: string;
      icon: string | null;
      color: string | null;
      total: number;
      count: number;
    }>();

    let grandTotal = 0;

    data.forEach((purchase: any) => {
      const categoryId = purchase.category?.id || 'uncategorized';
      const categoryName = purchase.category?.name || 'Sin categoría';
      const categoryIcon = purchase.category?.icon || null;
      const categoryColor = purchase.category?.color || null;
      const total_price = Number(purchase.total_price);

      grandTotal += total_price;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          name: categoryName,
          icon: categoryIcon,
          color: categoryColor,
          total: 0,
          count: 0,
        });
      }

      const cat = categoryMap.get(categoryId)!;
      cat.total += total_price;
      cat.count += 1;
    });

    // Convertir a array y calcular porcentajes
    const stats: CategoryStats[] = Array.from(categoryMap.entries()).map(
      ([categoryId, cat]) => ({
        category_id: categoryId === 'uncategorized' ? null : categoryId,
        category_name: cat.name,
        category_icon: cat.icon,
        category_color: cat.color,
        total: cat.total,
        count: cat.count,
        percentage: grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0,
      })
    );

    // Ordenar por total descendente
    stats.sort((a, b) => b.total - a.total);

    return stats;
  }

  async getTypeStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TypeStats> {
    let query = supabase
      .from('purchases')
      .select('total_price, type')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('purchase_date', startDate.toISOString().split('T')[0]);
    }

    if (endDate) {
      query = query.lte('purchase_date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    const compras = { total: 0, count: 0 };
    const dakinos = { total: 0, count: 0 };

    data.forEach((purchase: any) => {
      const total_price = Number(purchase.total_price);
      const type = purchase.type || 'compra'; // Default to compra for legacy data

      if (type === 'dakino') {
        dakinos.total += total_price;
        dakinos.count += 1;
      } else {
        compras.total += total_price;
        compras.count += 1;
      }
    });

    const totalValue = compras.total + dakinos.total;
    const savingsPercentage = totalValue > 0 ? (dakinos.total / totalValue) * 100 : 0;

    return {
      compras,
      dakinos,
      totalValue,
      savingsPercentage
    };
  }

  async getTopProducts(userId: string, limit = 5): Promise<Array<{
    product_name: string;
    total: number;
    count: number;
  }>> {
    const { data, error } = await supabase
      .from('purchases')
      .select('product_name, total_price')
      .eq('user_id', userId);

    if (error) throw error;

    // Agrupar por producto
    const productMap = new Map<string, { total: number; count: number }>();

    data.forEach((purchase: any) => {
      const name = purchase.product_name;
      const total_price = Number(purchase.total_price);

      if (!productMap.has(name)) {
        productMap.set(name, { total: 0, count: 0 });
      }

      const prod = productMap.get(name)!;
      prod.total += total_price;
      prod.count += 1;
    });

    // Convertir a array y ordenar
    const topProducts = Array.from(productMap.entries())
      .map(([product_name, stats]) => ({
        product_name,
        ...stats,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    return topProducts;
  }
}

export const statisticsService = new StatisticsService();
