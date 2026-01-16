import { useState } from 'react';
import { Modal } from '@/components/common/Modal';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string) => Promise<void>;
  title: string;
  placeholder: string;
  iconSuggestions: string[];
}

export const QuickCreateModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  placeholder,
  iconSuggestions,
}: QuickCreateModalProps) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(iconSuggestions[0]);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onSave(name.trim(), selectedIcon);
      setName('');
      setSelectedIcon(iconSuggestions[0]);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-sm font-bold text-neutral-700 mb-2">
            Icono
          </label>
          <div className="grid grid-cols-6 gap-2">
            {iconSuggestions.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setSelectedIcon(icon)}
                className={`aspect-square text-2xl rounded-xl transition-all ${
                  selectedIcon === icon
                    ? 'bg-primary-500 text-white scale-110 shadow-lg'
                    : 'bg-neutral-100 hover:bg-neutral-200'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
