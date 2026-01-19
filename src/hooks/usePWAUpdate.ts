import { useEffect, useCallback } from 'react';
import { useToast } from './useToast';

export const usePWAUpdate = () => {
  const { success, info } = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      success('App actualizada. Recargando...');
      setTimeout(() => window.location.reload(), 1000);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Verificar actualizaciones periódicamente
    const checkForUpdates = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.update();
      }
    };

    // Verificar cada hora
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(interval);
    };
  }, [success]);

  // Función para forzar actualización manual
  const forceUpdate = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      info('PWA no disponible');
      return;
    }

    info('Buscando actualizaciones...');

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();

        // Si hay un nuevo SW esperando, activarlo
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          success('Ya tienes la última versión');
        }
      }
    } catch (error) {
      console.error('Error checking updates:', error);
    }
  }, [info, success]);

  return { forceUpdate };
};
