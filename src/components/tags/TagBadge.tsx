import type { Tag } from '@/types/models';
import { X } from 'lucide-react';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export const TagBadge = ({ tag, onRemove, size = 'md' }: TagBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold transition-all ${sizeClasses[size]}`}
      style={{
        backgroundColor: tag.color + '20',
        color: tag.color,
        border: `1.5px solid ${tag.color}40`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
        >
          <X size={size === 'sm' ? 12 : 14} />
        </button>
      )}
    </span>
  );
};
