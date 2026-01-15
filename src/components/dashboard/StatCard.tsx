import { ReactNode, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  trend?: number;
  gradient: string;
  delay?: number;
}

export const StatCard = ({ label, value, prefix = '$', trend, gradient, delay = 0 }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(prev => Math.min(prev + increment, value));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      style={{
        background: gradient,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10">
        <p className="text-sm font-medium text-white/80 uppercase tracking-wider mb-2">
          {label}
        </p>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-white tracking-tight">
            {prefix}{displayValue.toFixed(2)}
          </span>
        </div>

        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 ${trend >= 0 ? 'text-green-100' : 'text-red-100'}`}>
            {trend >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span className="text-sm font-semibold">
              {Math.abs(trend).toFixed(1)}% vs ayer
            </span>
          </div>
        )}
      </div>

      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />
    </div>
  );
};
