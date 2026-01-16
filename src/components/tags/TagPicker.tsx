import { useState, useEffect } from 'react';
import { tagService } from '@/services/tag.service';
import { useAuthStore } from '@/store/authStore';
import type { Tag } from '@/types/models';
import { TagBadge } from './TagBadge';
import { Plus, Tag as TagIcon } from 'lucide-react';

const TAG_COLORS = [
  '#FF1744', // Rosa
  '#0EA5E9', // Azul
  '#F59E0B', // Ámbar
  '#10B981', // Verde
  '#9333EA', // Púrpura
  '#EC4899', // Pink
  '#F97316', // Naranja
  '#6366F1', // Índigo
];

interface TagPickerProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export const TagPicker = ({ selectedTags, onTagsChange }: TagPickerProps) => {
  const { user } = useAuthStore();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTags();
    }
  }, [user]);

  const loadTags = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const tags = await tagService.getTags(user.id);
      setAllTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTagName.trim()) return;

    try {
      const newTag = await tagService.createTag({
        user_id: user.id,
        name: newTagName.trim(),
        color: newTagColor,
      });

      setAllTags([...allTags, newTag]);
      onTagsChange([...selectedTags, newTag]);
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-neutral-400">
        <TagIcon size={24} className="mx-auto mb-2 animate-pulse" />
        <p className="text-sm">Cargando etiquetas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onRemove={() => handleToggleTag(tag)}
            />
          ))}
        </div>
      )}

      {/* Available Tags */}
      {allTags.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-neutral-600 mb-2">
            Etiquetas disponibles
          </label>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => {
              const isSelected = selectedTags.some(t => t.id === tag.id);
              if (isSelected) return null;

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className="text-sm px-3 py-1 rounded-full font-bold transition-all hover:scale-105"
                  style={{
                    backgroundColor: tag.color + '10',
                    color: tag.color,
                    border: `1.5px solid ${tag.color}30`,
                  }}
                >
                  + {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Create New Tag */}
      {showCreateForm ? (
        <form onSubmit={handleCreateTag} className="bg-neutral-50 rounded-xl p-3 space-y-3">
          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Nombre de la etiqueta
            </label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Ej: Urgente, Recurrente, Lujo..."
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-accent-500 focus:outline-none"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {TAG_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    newTagColor === color ? 'ring-2 ring-neutral-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewTagName('');
                setNewTagColor(TAG_COLORS[0]);
              }}
              className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 font-bold rounded-lg hover:bg-neutral-300 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newTagName.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-accent-500 to-orange-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm"
            >
              Crear
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 text-neutral-600 font-bold rounded-xl hover:border-accent-500 hover:text-accent-600 transition-all"
        >
          <Plus size={18} />
          Nueva Etiqueta
        </button>
      )}
    </div>
  );
};
