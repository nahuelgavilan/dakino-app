import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  label?: string;
  className?: string;
}

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  minDate,
  maxDate,
  label,
  className = '',
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    if (minDate) return new Date(minDate);
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Monday=0
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };

  const isSelected = (date: Date): boolean => {
    if (!value) return false;
    return date.toISOString().split('T')[0] === value;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (isDateDisabled(date)) return;
    onChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const navigateMonth = (delta: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-9 h-9" />);
  }
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const disabled = isDateDisabled(date);
    const today = isToday(date);
    const selected = isSelected(date);

    days.push(
      <button
        key={day}
        type="button"
        disabled={disabled}
        onClick={() => handleDateClick(day)}
        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
          selected
            ? 'bg-primary-500 text-white shadow-md'
            : today
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : disabled
            ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
        </label>
      )}

      {/* Input Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center gap-3 text-left focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
      >
        <Calendar size={18} className="text-neutral-400 flex-shrink-0" />
        <span className={`flex-1 ${value ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500'}`}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-full transition-colors"
          >
            <X size={14} className="text-neutral-400" />
          </button>
        )}
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 right-0 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-neutral-600 dark:text-neutral-400" />
            </button>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day) => (
              <div
                key={day}
                className="w-9 h-6 flex items-center justify-center text-xs font-bold text-neutral-500 dark:text-neutral-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onChange(new Date().toISOString().split('T')[0]);
                setIsOpen(false);
              }}
              className="flex-1 py-2 text-sm font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 7);
                onChange(tomorrow.toISOString().split('T')[0]);
                setIsOpen(false);
              }}
              className="flex-1 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              +7 días
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                onChange(nextMonth.toISOString().split('T')[0]);
                setIsOpen(false);
              }}
              className="flex-1 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              +1 mes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
