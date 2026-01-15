import { useToastStore } from '@/store/toastStore';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import type { ToastType } from '@/store/toastStore';

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; gradient: string; bgColor: string }> = {
  success: {
    icon: CheckCircle,
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
  },
  error: {
    icon: XCircle,
    gradient: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
  },
  warning: {
    icon: AlertCircle,
    gradient: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
  },
  info: {
    icon: Info,
    gradient: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
  },
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`${config.bgColor} rounded-2xl shadow-xl border-2 border-white/50 backdrop-blur-sm overflow-hidden transform transition-all duration-300 animate-slideIn`}
            style={{
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <div className="flex items-start gap-3 p-4">
              {/* Icon with gradient */}
              <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} flex-shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>

              {/* Message */}
              <p className="flex-1 text-neutral-800 font-medium text-sm leading-relaxed pt-1">
                {toast.message}
              </p>

              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={16} className="text-neutral-500" />
              </button>
            </div>

            {/* Progress bar */}
            <div
              className={`h-1 bg-gradient-to-r ${config.gradient}`}
              style={{
                animation: `progress ${toast.duration ?? 3000}ms linear`,
              }}
            />
          </div>
        );
      })}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
