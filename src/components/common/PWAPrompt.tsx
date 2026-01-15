import { RefreshCw, Download, X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export const PWAPrompt = () => {
  const { needRefresh, offlineReady, update, close } = useServiceWorker();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-neutral-100 overflow-hidden animate-slideUp">
        {needRefresh ? (
          /* Update Available */
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-100 rounded-xl flex-shrink-0">
                <RefreshCw size={24} className="text-primary-600" />
              </div>

              <div className="flex-1">
                <h3 className="font-black text-lg text-neutral-900 mb-1">
                  Nueva versión disponible
                </h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Hay una actualización de Dakino lista para instalar
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={update}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95"
                  >
                    Actualizar ahora
                  </button>
                  <button
                    onClick={close}
                    className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                  >
                    <X size={20} className="text-neutral-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Offline Ready */
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-xl flex-shrink-0">
                <Download size={24} className="text-green-600" />
              </div>

              <div className="flex-1">
                <h3 className="font-black text-lg text-neutral-900 mb-1">
                  App lista para offline
                </h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Dakino está lista para funcionar sin conexión
                </p>

                <button
                  onClick={close}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
