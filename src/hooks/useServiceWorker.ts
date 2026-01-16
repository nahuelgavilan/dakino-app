import { useState } from 'react';

export const useServiceWorker = () => {
  const [needRefresh] = useState(false);
  const [offlineReady] = useState(false);

  const update = async () => {
    // PWA update logic will be implemented when needed
  };

  const close = () => {
    // Close notification logic
  };

  return {
    needRefresh,
    offlineReady,
    update,
    close,
  };
};
