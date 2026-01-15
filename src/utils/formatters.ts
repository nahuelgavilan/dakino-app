import { format, formatDistance, formatRelative } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número como moneda
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formatea una fecha en formato corto (ej: 15/01/2024)
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: es });
};

/**
 * Formatea una fecha en formato largo (ej: 15 de enero de 2024)
 */
export const formatDateLong = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: es });
};

/**
 * Formatea una fecha relativa (ej: hace 2 horas, ayer, hace 3 días)
 */
export const formatDateRelative = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: es });
};

/**
 * Formatea una fecha con contexto (ej: hoy a las 14:30, ayer a las 10:00)
 */
export const formatDateWithContext = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatRelative(dateObj, new Date(), { locale: es });
};

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Formatea un peso (kg, g, l, ml)
 */
export const formatWeight = (weight: number, unit: string): string => {
  return `${formatNumber(weight, 2)} ${unit}`;
};

/**
 * Abrevia un texto si es muy largo
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};
