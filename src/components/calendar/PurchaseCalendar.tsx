import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ShoppingBag } from 'lucide-react';
import type { Purchase } from '@/types/models';

interface PurchaseCalendarProps {
  purchases: Purchase[];
  onDateSelect?: (date: string) => void;
  selectedDate?: string | null;
}

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const PurchaseCalendar = ({ purchases, onDateSelect, selectedDate }: PurchaseCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group purchases by date
  const purchasesByDate = useMemo(() => {
    const grouped: Record<string, Purchase[]> = {};
    purchases.forEach(purchase => {
      const date = purchase.purchase_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(purchase);
    });
    return grouped;
  }, [purchases]);

  // Calculate total spending by date
  const totalsByDate = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(purchasesByDate).forEach(([date, purchasesOnDate]) => {
      totals[date] = purchasesOnDate.reduce((sum, p) => sum + p.total_price, 0);
    });
    return totals;
  }, [purchasesByDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return formatDateKey(date) === selectedDate;
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
          <CalendarIcon className="inline mr-2 mb-1" size={28} />
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Hoy
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS_OF_WEEK.map(day => (
          <div
            key={day}
            className="text-center text-sm font-bold text-neutral-500 dark:text-neutral-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = formatDateKey(date);
          const purchasesOnDate = purchasesByDate[dateKey] || [];
          const totalOnDate = totalsByDate[dateKey] || 0;
          const hasPurchases = purchasesOnDate.length > 0;
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect?.(dateKey)}
              className={`
                aspect-square rounded-2xl p-2 transition-all duration-200
                flex flex-col items-center justify-center
                ${today ? 'ring-2 ring-primary-500' : ''}
                ${selected ? 'bg-primary-500 text-white shadow-lg scale-105' : ''}
                ${!selected && hasPurchases ? 'bg-secondary-50 dark:bg-secondary-900/20 hover:bg-secondary-100 dark:hover:bg-secondary-900/30' : ''}
                ${!selected && !hasPurchases ? 'hover:bg-neutral-50 dark:hover:bg-neutral-700' : ''}
              `}
            >
              <span className={`
                text-sm font-bold mb-1
                ${selected ? 'text-white' : today ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'}
              `}>
                {date.getDate()}
              </span>

              {hasPurchases && (
                <div className="flex flex-col items-center gap-1">
                  <ShoppingBag
                    size={14}
                    className={selected ? 'text-white' : 'text-secondary-500 dark:text-secondary-400'}
                  />
                  <span className={`
                    text-xs font-bold
                    ${selected ? 'text-white' : 'text-secondary-600 dark:text-secondary-400'}
                  `}>
                    ${totalOnDate.toFixed(0)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-primary-500" />
          <span className="text-neutral-600 dark:text-neutral-400">Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-secondary-50 dark:bg-secondary-900/20" />
          <span className="text-neutral-600 dark:text-neutral-400">Con compras</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-500" />
          <span className="text-neutral-600 dark:text-neutral-400">Seleccionado</span>
        </div>
      </div>
    </div>
  );
};
