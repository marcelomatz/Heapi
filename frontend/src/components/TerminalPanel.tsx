import { useEffect, useRef, useState, useCallback } from 'react';
import { getAvailableShells, sendData, closeSession } from '../api/terminal';
import { Search, X, ChevronUp, ChevronDown, Trash2, Plus, Terminal as TerminalIcon, TerminalSquare, PanelBottomClose } from 'lucide-react';
import { SearchAddon } from '@xterm/addon-search';

import ShellPicker, { getShellMeta } from './terminal/ShellPicker';
import LogConsole from './terminal/LogConsole';
import TerminalInstance from './terminal/TerminalInstance';
import type { Shell, TerminalTab, LogEntry, LogType } from '../types';

const generateId = () => Math.random().toString(36).slice(2, 10);

interface TerminalPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  isMaximized?: boolean;
}

const TerminalPanel = ({ isOpen, onToggle, isMaximized }: TerminalPanelProps) => {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableShells, setAvailableShells] = useState<Shell[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<DOMRect | null>(null);

  // Resize logic
  const [height, setHeight] = useState(220);
  const isResizingRef = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleResizing);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'row-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleResizing);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleResizing = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
      setHeight(newHeight);
    }
  }, []);

  const searchRefs = useRef<Record<string, SearchAddon>>({});
  const addBtnRef  = useRef<HTMLButtonElement>(null);

  const addLog = useCallback((message: string, type: LogType = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev.slice(-99), { id: generateId(), time, message, type }]);
  }, []);

  const createTab = useCallback((shell: Shell) => {
    const tabId     = generateId();
    const sessionId = generateId();
    const meta      = getShellMeta(shell.id);
    setTabs(prev => [...prev, { id: tabId, sessionId, shellId: shell.id, shellPath: shell.path, name: meta.label }]);
    setActiveTabId(tabId);
  }, []);

  const closeTab = useCallback(async (e: React.MouseEvent | null, tabId: string) => {
    if (e) e.stopPropagation();
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      await closeSession(tab.sessionId);
      delete searchRefs.current[tabId];
    }
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  }, [tabs, activeTabId]);

  const handleAddClick = useCallback(() => {
    if (availableShells.length === 0) return;
    if (availableShells.length === 1) { createTab(availableShells[0]); return; }
    if (addBtnRef.current) setPickerAnchor(addBtnRef.current.getBoundingClientRect());
    setIsPickerOpen(prev => !prev);
  }, [availableShells, createTab]);

  useEffect(() => {
    addLog('Terminal manager initialized.');
    getAvailableShells().then(shells => {
      setAvailableShells(shells);
      addLog(`Found ${shells.length} available shells.`);
    });
  }, [addLog]);

  useEffect(() => {
    const handlePicker = () => handleAddClick();
    const handleNext = () => {
      if (tabs.length > 1) {
        const idx = tabs.findIndex(t => t.id === activeTabId);
        setActiveTabId(tabs[(idx + 1) % tabs.length].id);
      }
    };
    const handlePrev = () => {
      if (tabs.length > 1) {
        const idx = tabs.findIndex(t => t.id === activeTabId);
        setActiveTabId(tabs[(idx - 1 + tabs.length) % tabs.length].id);
      }
    };
    const handleCloseActive = () => {
      if (activeTabId) closeTab(null, activeTabId);
    };
    window.addEventListener('terminal:open-picker', handlePicker);
    window.addEventListener('terminal:next-tab', handleNext);
    window.addEventListener('terminal:prev-tab', handlePrev);
    window.addEventListener('terminal:close-active-tab', handleCloseActive);
    return () => {
      window.removeEventListener('terminal:open-picker', handlePicker);
      window.removeEventListener('terminal:next-tab', handleNext);
      window.removeEventListener('terminal:prev-tab', handlePrev);
      window.removeEventListener('terminal:close-active-tab', handleCloseActive);
    };
  }, [availableShells, activeTabId, tabs, closeTab, handleAddClick]);

  const activeTab    = tabs.find(t => t.id === activeTabId);
  const activeSearch = activeTab ? searchRefs.current[activeTab.id] : null;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val && activeSearch) activeSearch.findNext(val);
  };
  const findNext = () => activeSearch?.findNext(searchQuery);
  const findPrev = () => activeSearch?.findPrevious(searchQuery);
  const clearTerminal = () => {
    if (activeTab) sendData(activeTab.sessionId, 'cls\r');
  };

  return (
    <>
      {isPickerOpen && (
        <ShellPicker
          shells={availableShells}
          anchorRect={pickerAnchor}
          activeShellId={activeTab?.shellId}
          onPick={(shell) => { createTab(shell); setIsPickerOpen(false); }}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-40 flex flex-col transition-[transform,opacity] duration-300 ease-out bg-bg border-t border-border ${isMaximized ? '' : 'rounded-b-[12px]'} ${isOpen ? 'translate-y-0 shadow-[0_-8px_40px_rgba(0,0,0,0.8)] opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
        style={{ 
          height: `${height}px`,
          transition: isResizingRef.current ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-50 hover:bg-primary/30 transition-colors"
        />

        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 h-9 bg-bg-secondary border-b border-border shrink-0 select-none">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            <TerminalSquare size={14} className="text-accent-green" />
            Local Terminal
          </div>
          <button 
            onClick={onToggle}
            className="p-1 hover:bg-white/5 rounded transition-colors text-muted-foreground"
          >
            <PanelBottomClose size={16} />
          </button>
        </div>

        {/* Terminal Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {tabs.length === 0 ? (
            <div className="flex-1 h-full flex items-center justify-center text-muted-foreground/30 text-[11px] font-mono italic">
              No active sessions. 
              <button 
                ref={addBtnRef}
                onClick={handleAddClick}
                className="ml-4 px-3 py-1 bg-white/5 border border-border/50 rounded hover:bg-white/10 transition-all text-foreground"
              >
                + Start Session
              </button>
            </div>
          ) : (
            <>
              {/* Tab Bar (only shown if multiple tabs) */}
              {tabs.length > 1 && (
                <div className="flex h-7 border-b border-border/30 bg-black/40 overflow-x-auto scrollbar-hide shrink-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={`px-3 flex items-center gap-2 border-r border-border/30 text-[10px] font-medium transition-all shrink-0
                        ${tab.id === activeTabId ? 'bg-white/5 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <span className="truncate max-w-[100px]">{tab.name}</span>
                      <X size={10} className="hover:text-destructive" onClick={(e) => closeTab(e, tab.id)} />
                    </button>
                  ))}
                  <button ref={addBtnRef} onClick={handleAddClick} className="px-3 text-muted-foreground hover:text-foreground">+</button>
                </div>
              )}

              {/* Terminal Instances */}
              <div className="flex-1 relative overflow-hidden">
                {tabs.map((tab) => (
                  <div 
                    key={tab.id} 
                    className={`absolute inset-0 ${tab.id === activeTabId ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                  >
                    <TerminalInstance
                      tab={tab}
                      isActive={tab.id === activeTabId}
                      onClose={() => closeTab(null, tab.id)}
                      onRegisterSearch={(addon) => { searchRefs.current[tab.id] = addon; }}
                      onLog={addLog}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TerminalPanel;
