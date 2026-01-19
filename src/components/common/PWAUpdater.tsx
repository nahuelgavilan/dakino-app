import { usePWAUpdate } from '@/hooks/usePWAUpdate';

export const PWAUpdater = () => {
  // Este hook maneja las actualizaciones automáticas
  usePWAUpdate();

  return null; // No renderiza nada, solo maneja la lógica
};
