import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ theme, onToggle, compact = false, className = '' }) {
  const isDark = theme === 'dark';
  return (
    <button
      className={`icon-action theme-toggle ${compact ? 'is-compact' : ''} ${className}`.trim()}
      type="button"
      onClick={onToggle}
      aria-label="切换明暗主题"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
      {!compact && <span>{isDark ? '浅色' : '深色'}</span>}
    </button>
  );
}
