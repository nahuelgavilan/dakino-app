import { useToastStore } from '@/store/toastStore';
import type { ToastType } from '@/store/toastStore';

export const useToast = () => {
  const { addToast } = useToastStore();

  const toast = (message: string, type: ToastType = 'info', duration?: number) => {
    addToast({ message, type, duration });
  };

  return {
    toast,
    success: (message: string, duration?: number) => toast(message, 'success', duration),
    error: (message: string, duration?: number) => toast(message, 'error', duration),
    warning: (message: string, duration?: number) => toast(message, 'warning', duration),
    info: (message: string, duration?: number) => toast(message, 'info', duration),
  };
};
