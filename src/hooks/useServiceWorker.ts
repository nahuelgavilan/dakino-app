import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const useServiceWorker = () => {
  const [needRefresh, setNeedRefresh] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [swNeedRefresh, setSwNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      setOfflineReady(true);
    },
    onNeedRefresh() {
      console.log('New content available, please refresh');
      setSwNeedRefresh(true);
      setNeedRefresh(true);
    },
  });

  const update = async () => {
    await updateServiceWorker(true);
    setNeedRefresh(false);
  };

  const close = () => {
    setOfflineReady(false);
    setSwNeedRefresh(false);
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    offlineReady,
    update,
    close,
  };
};
