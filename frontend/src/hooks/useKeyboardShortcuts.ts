import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onToggleTerminal: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onOpenCommandCenter: () => void;
  onCloseTab: () => void;
  onNewRequest: () => void;
  onNextTab: () => void;
  onPrevTab: () => void;
  onFocusUrl: () => void;
  onRename: () => void;
}

export const useKeyboardShortcuts = ({
  onToggleTerminal,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onOpenCommandCenter,
  onCloseTab,
  onNewRequest,
  onNextTab,
  onPrevTab,
  onFocusUrl,
  onRename,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        const key = e.key.toLowerCase();
        const code = e.code;

        if (key === '`' || key === 'j' || code === 'Backquote') {
          e.preventDefault();
          onToggleTerminal();
        } else if (key === 'b') {
          e.preventDefault();
          onToggleLeftSidebar();
        } else if (key === 'd') {
          e.preventDefault();
          onToggleRightSidebar();
        } else if (key === 'k') {
          e.preventDefault();
          onOpenCommandCenter();
        } else if (key === 'w') {
          e.preventDefault();
          onCloseTab();
        } else if (key === 't') {
          e.preventDefault();
          onNewRequest();
        } else if (key === 'tab') {
          e.preventDefault();
          if (e.shiftKey) {
            onPrevTab();
          } else {
            onNextTab();
          }
        } else if (key === 'l' || code === 'KeyL') {
          e.preventDefault();
          onFocusUrl();
        }
      } else {
        if (e.key === 'F2') {
          e.preventDefault();
          onRename();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleTerminal,
    onToggleLeftSidebar,
    onToggleRightSidebar,
    onOpenCommandCenter,
    onCloseTab,
    onNewRequest,
    onNextTab,
    onPrevTab,
    onFocusUrl,
    onRename,
  ]);
};
