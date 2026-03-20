import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import RequestPanel from './components/RequestPanel';
import EnvironmentManager from './components/EnvironmentManager';
import RightSidebar from './components/RightSidebar';
import TerminalPanel from './components/TerminalPanel';
import TitleBar from './components/TitleBar';
import RenameDialog from './components/RenameDialog';
import SettingsView from './components/SettingsView';
import EmptyState from './components/EmptyState';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import CommandCenter from './components/CommandCenter';
import * as runtime from '../wailsjs/runtime/runtime';
import {
  getEnvironments,
  createUntitledRequest,
  renameRequest,
  createCollection
} from './api';
import './index.css';
import type { Request, Environment } from './types';

function App() {
  const [tabs, setTabs] = useState<Request[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | 'settings' | null>(null);
  const [refreshSidebarTrigger, setRefreshSidebarTrigger] = useState(0);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(() => localStorage.getItem('selectedEnvId'));
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isEnvManagerOpen, setIsEnvManagerOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (selectedEnvId) {
      localStorage.setItem('selectedEnvId', selectedEnvId);
    } else {
      localStorage.removeItem('selectedEnvId');
    }
  }, [selectedEnvId]);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState<boolean>(() => localStorage.getItem('isSplitView') === 'true');
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameData, setRenameData] = useState({ id: '', name: '' });
  const [isNewCollectionModalOpen, setIsNewCollectionModalOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isStatusBarEnabled, setIsStatusBarEnabled] = useState<boolean>(() => localStorage.getItem('isStatusBarEnabled') === 'true');

  useEffect(() => {
    localStorage.setItem('isStatusBarEnabled', String(isStatusBarEnabled));
  }, [isStatusBarEnabled]);

  useEffect(() => {
    const unsub = runtime.EventsOn('wails:window-maximise', () => setIsMaximized(true));
    const unsub2 = runtime.EventsOn('wails:window-unmaximise', () => setIsMaximized(false));
    
    // Check initial state
    runtime.WindowIsMaximised().then(setIsMaximized);

    return () => {
      unsub();
      unsub2();
    };
  }, []);

  // Sidebar resize logic
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isResizingSidebarRef = useRef(false);

  const startResizingSidebar = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebarRef.current = true;
    document.addEventListener('mousemove', handleResizingSidebar);
    document.addEventListener('mouseup', stopResizingSidebar);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizingSidebar = useCallback(() => {
    isResizingSidebarRef.current = false;
    document.removeEventListener('mousemove', handleResizingSidebar);
    document.removeEventListener('mouseup', stopResizingSidebar);
    document.body.style.cursor = 'default';
  }, []);

  const handleResizingSidebar = useCallback((e: MouseEvent) => {
    if (!isResizingSidebarRef.current) return;
    const newWidth = e.clientX;
    if (newWidth > 150 && newWidth < 500) {
      setSidebarWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('isSplitView', String(isSplitView));
  }, [isSplitView]);

  useEffect(() => {
    loadEnvs();
  }, []);

  const loadEnvs = async () => {
    const data = await getEnvironments();
    setEnvironments(data || []);
  };

  useEffect(() => {
    document.documentElement.className = theme === 'custom' ? 'dark custom' : theme;
    localStorage.setItem('theme', theme);
    
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.style.cssText = '';
    } else if (theme === 'custom') {
      const yaml = localStorage.getItem('customThemeYaml');
      if (yaml) {
        const lines = yaml.split('\n');
        let inColors = false;
        const root = document.documentElement;
        for (const line of lines) {
          if (line.trim().startsWith('colors:')) { inColors = true; continue; }
          if (inColors) {
            if (line.trim() === '' || line.trim().startsWith('#')) continue;
            if (!line.match(/^\s+/)) { inColors = false; continue; }
            const match = line.match(/^\s+([a-zA-Z0-9_-]+)\s*:\s*["']?([^"']+)["']?\s*$/);
            if (match) {
              root.style.setProperty(`--${match[1]}`, match[2]);
            }
          }
        }
      }
    }
  }, [theme]);

  const openTab = useCallback((request: Request | (Partial<Request> & { ID: string })) => {
    setTabs(prev => {
      const existing = prev.find(t => t.ID === request.ID);
      if (!existing) {
        return [...prev, request as Request];
      }
      return prev;
    });
    setActiveTabId(request.ID);
  }, []);

  const openSettings = () => {
    setActiveTabId('settings');
  };

  const closeTab = useCallback((e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    setTabs(prev => {
      const newTabs = prev.filter(t => t.ID !== id);
      setActiveTabId(currentActiveId => {
        if (currentActiveId === id) {
          return newTabs.length > 0 ? newTabs[newTabs.length - 1].ID : null;
        }
        return currentActiveId;
      });
      return newTabs;
    });
  }, []);

  const handleDeleteRequest = (id: string) => {
    closeTab(null, id);
  };

  const handleDeleteCollection = (requests: Request[]) => {
    if (requests) {
      requests.forEach(req => closeTab(null, req.ID));
    }
  };

  const refreshSidebar = useCallback(() => {
    setRefreshSidebarTrigger(prev => prev + 1);
  }, []);

  // Global UI Keyboard Shortcuts via custom hook
  useKeyboardShortcuts({
    onToggleTerminal: () => setIsTerminalOpen(prev => !prev),
    onToggleLeftSidebar: () => setIsLeftSidebarOpen(prev => !prev),
    onToggleRightSidebar: () => setIsRightSidebarOpen(prev => !prev),
    onOpenCommandCenter: () => setIsCommandCenterOpen(prev => !prev),
    onCloseTab: () => {
      if (isTerminalOpen && activeTabId && activeTabId !== 'settings') {
         window.dispatchEvent(new CustomEvent('terminal:close-active-tab'));
      } else if (activeTabId && activeTabId !== 'settings') {
        closeTab(null, activeTabId);
      }
    },
    onNewRequest: async () => {
      if (isTerminalOpen) {
        window.dispatchEvent(new CustomEvent('terminal:open-picker'));
      } else {
        const req = await createUntitledRequest();
        if (req) {
          openTab(req);
          refreshSidebar();
        }
      }
    },
    onNextTab: () => {
      if (isTerminalOpen) {
        window.dispatchEvent(new CustomEvent('terminal:next-tab'));
      } else if (tabs.length > 1) {
        const currentIndex = tabs.findIndex(t => t.ID === activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTabId(tabs[nextIndex].ID);
      }
    },
    onPrevTab: () => {
      if (isTerminalOpen) {
        window.dispatchEvent(new CustomEvent('terminal:prev-tab'));
      } else if (tabs.length > 1) {
        const currentIndex = tabs.findIndex(t => t.ID === activeTabId);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        setActiveTabId(tabs[prevIndex].ID);
      }
    },
    onFocusUrl: () => {
      window.dispatchEvent(new CustomEvent('request:focus-url'));
    },
    onRename: () => {
      const activeReq = tabs.find(t => t.ID === activeTabId);
      if (activeReq) {
        setRenameData({ id: activeReq.ID, name: activeReq.name });
        setIsRenameModalOpen(true);
      }
    }
  });

  const updateTab = (id: string, updates: Partial<Request>) => {
    setTabs(prev => prev.map((t: Request) => t.ID === id ? { ...t, ...updates, isDirty: true } : t));
  };

  const updateTabState = (id: string, updates: Partial<Request>) => {
    setTabs(prev => prev.map((t: Request) => t.ID === id ? { ...t, ...updates } : t));
  };

  const saveTab = (id: string) => {
    setTabs(prev => prev.map((t: Request) => t.ID === id ? { ...t, isDirty: false } : t));
    refreshSidebar();
  };

  const handleRenameRequest = async (newName: string) => {
    if (!renameData.id) return;
    await renameRequest(renameData.id, newName);
    setTabs(prev => prev.map((t: Request) => t.ID === renameData.id ? { ...t, name: newName } : t));
    saveTab(renameData.id);
    setRenameData({ id: '', name: '' });
  };

  const handleCreateCollection = async (name: string) => {
    const col = await createCollection(name);
    if (col) {
      refreshSidebar();
    }
  };

  const activeRequest = tabs.find(t => t.ID === activeTabId);

  return (
    <div className={`flex flex-col h-full bg-background text-foreground overflow-hidden relative ${isMaximized ? '' : 'rounded-[12px] border border-border/30 shadow-2xl'}`}>
      <TitleBar 
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={closeTab}
        environments={environments}
        selectedEnvId={selectedEnvId}
        onSelectEnv={setSelectedEnvId}
        onOpenEnvManager={() => setIsEnvManagerOpen(true)}
        onToggleSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isTerminalOpen={isTerminalOpen}
        onOpenSettings={openSettings}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {isLeftSidebarOpen && (
          <>
            <Sidebar
              key={refreshSidebarTrigger}
              width={sidebarWidth}
              onSelectRequest={openTab}
              selectedRequestId={activeTabId as string}
              onDeleteRequest={handleDeleteRequest}
              onDeleteCollection={handleDeleteCollection}
              onRefreshSidebar={refreshSidebar}
              onNewCollection={() => setIsNewCollectionModalOpen(true)}
            />
            {/* Sidebar Resizer Handle */}
            <div
              onMouseDown={startResizingSidebar}
              className="w-1 cursor-col-resize hover:bg-primary/50 z-20 transition-colors bg-border/20 shrink-0"
            />
          </>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-background/50">
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {activeTabId === 'settings' ? (
              <SettingsView 
                theme={theme}
                onThemeChange={(t) => setTheme(t)}
                isStatusBarEnabled={isStatusBarEnabled}
                onStatusBarToggle={setIsStatusBarEnabled}
              />
            ) : activeRequest ? (
              <RequestPanel
                key={activeRequest.ID}
                request={activeRequest}
                selectedEnvId={selectedEnvId}
                isSplitView={isSplitView}
                onRefreshSidebar={refreshSidebar}
                onUpdateTab={updateTab}
                onUpdateTabState={updateTabState}
                onSave={saveTab}
              />
            ) : (
              <EmptyState />
            )}
          </div>

          <RightSidebar
            isOpen={isRightSidebarOpen}
            onClose={() => setIsRightSidebarOpen(false)}
            request={activeRequest || null}
          />
        </main>
      </div>

      <TerminalPanel
        isOpen={isTerminalOpen}
        onToggle={() => setIsTerminalOpen(prev => !prev)}
        isMaximized={isMaximized}
      />

      {isStatusBarEnabled && (
        <Footer 
          isLeftOpen={isLeftSidebarOpen}
          onToggleLeft={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          isRightOpen={isRightSidebarOpen}
          onToggleRight={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
          isSplitView={isSplitView}
          onToggleSplitView={() => setIsSplitView(!isSplitView)}
          envName={environments.find(e => e.ID === selectedEnvId)?.name || null}
        />
      )}

      <EnvironmentManager
        isOpen={isEnvManagerOpen}
        onClose={() => setIsEnvManagerOpen(false)}
        environments={environments}
        onRefresh={loadEnvs}
        onSelect={setSelectedEnvId}
        selectedId={selectedEnvId}
      />

      <RenameDialog
        isOpen={isNewCollectionModalOpen}
        onClose={() => setIsNewCollectionModalOpen(false)}
        onConfirm={handleCreateCollection}
        title="New Collection"
        defaultValue="Untitled Collection"
      />

      <RenameDialog
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onConfirm={handleRenameRequest}
        title="Rename Request"
        defaultValue={renameData.name}
      />
      <CommandCenter 
        isOpen={isCommandCenterOpen} 
        onOpenChange={setIsCommandCenterOpen}
        actions={{
          onNewRequest: async () => {
            const req = await createUntitledRequest();
            if (req) { openTab(req); refreshSidebar(); }
          },
          onNewCollection: () => {
            setIsNewCollectionModalOpen(true);
          },
          onToggleTerminal: () => setIsTerminalOpen(prev => !prev),
          onToggleSidebar: () => setIsLeftSidebarOpen(prev => !prev),
          onOpenSettings: openSettings,
          onOpenEnvManager: () => setIsEnvManagerOpen(true),
          onExecuteRequest: () => {
            window.dispatchEvent(new CustomEvent('request:send'));
          }
        }}
      />
    </div>
  );
}

export default App;
