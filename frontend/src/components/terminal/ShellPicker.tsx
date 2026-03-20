import { useEffect, useRef, useState } from 'react';
import type { Shell } from '../../types';

// ─── Shell Metadata ────────────────────────────────────────────────────────────

interface ShellMeta {
  label: string;
  color: string;
  glyph: string;
}

const SHELL_META: Record<string, ShellMeta> = {
  pwsh:    { label: 'PowerShell',   color: '#5b9bd5', glyph: 'PS'  },
  pwsh7:   { label: 'PowerShell 7', color: '#7b5ea7', glyph: 'PS7' },
  cmd:     { label: 'CMD',          color: '#f4a300', glyph: 'CMD' },
  gitbash: { label: 'Git Bash',     color: '#f14e32', glyph: 'BAS' },
  wsl:     { label: 'WSL',          color: '#4caf50', glyph: 'WSL' },
  default: { label: 'Shell',        color: '#888',    glyph: '>_'  },
};

export const getShellMeta = (id: string): ShellMeta =>
  SHELL_META[id] ?? SHELL_META.default;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ShellPickerProps {
  shells: Shell[];
  anchorRect: DOMRect | null;
  onPick: (shell: Shell) => void;
  onClose: () => void;
  activeShellId?: string;
}

// ─── ShellPicker ──────────────────────────────────────────────────────────────

const ShellPicker = ({ shells, anchorRect, onPick, onClose, activeShellId }: ShellPickerProps) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const sortedShells = [...shells].sort((a, b) => {
    if (a.id === activeShellId) return -1;
    if (b.id === activeShellId) return 1;
    return 0;
  });

  useEffect(() => {
    pickerRef.current?.focus();
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % sortedShells.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + sortedShells.length) % sortedShells.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onPick(sortedShells[focusedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!anchorRect) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: anchorRect.left,
    bottom: window.innerHeight - anchorRect.top + 4,
    width: '200px',
    zIndex: 9999,
    background: 'hsl(var(--muted))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  };

  return (
    <div
      ref={pickerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={style}
      className="animate-in slide-in-from-bottom-2 duration-200 outline-none"
    >
      <div style={{ padding: '8px 12px 6px', borderBottom: '1px solid hsl(var(--border)/0.5)', fontSize: '9px', color: 'hsl(var(--muted-foreground))', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Select Shell
      </div>
      {sortedShells.map((s, idx) => {
        const meta = getShellMeta(s.id);
        const isFocused = idx === focusedIndex;
        return (
          <button
            key={s.id}
            onClick={() => { onPick(s); onClose(); }}
            onMouseEnter={() => setFocusedIndex(idx)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '9px 12px',
              background: isFocused ? 'hsl(var(--primary)/0.1)' : 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.12s',
            }}
          >
            <span style={{
              fontSize: '9px', fontFamily: 'monospace', fontWeight: 900,
              color: meta.color, minWidth: '28px', textAlign: 'center',
              padding: '2px 4px', borderRadius: '4px',
              background: isFocused ? `${meta.color}33` : `${meta.color}18`
            }}>
              {meta.glyph}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isFocused ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>
                {meta.label}
              </div>
            </div>
            {isFocused && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />}
          </button>
        );
      })}
    </div>
  );
};

export default ShellPicker;
