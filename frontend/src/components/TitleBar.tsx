import React, { useEffect, useState } from 'react';
import { X, Globe, ChevronDown, PanelLeftClose, Settings, TerminalSquare, Minus, Square, X as CloseIcon } from 'lucide-react';
import * as runtime from '../../wailsjs/runtime/runtime';
import EnvironmentSelector from './EnvironmentSelector';
import type { Request, Environment } from '../types';
import logo from '../assets/images/appicon.png';

interface TitleBarProps {
  tabs: Request[];
  activeTabId: string | 'settings' | null;
  onSelectTab: (id: string | 'settings' | null) => void;
  onCloseTab: (e: React.MouseEvent | null, id: string) => void;
  environments: Environment[];
  selectedEnvId: string | null;
  onSelectEnv: (id: string | null) => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  isTerminalOpen: boolean;
  onOpenSettings: () => void;
  onOpenEnvManager: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  environments,
  selectedEnvId,
  onSelectEnv,
  onToggleSidebar,
  onToggleTerminal,
  isTerminalOpen,
  onOpenSettings,
  onOpenEnvManager
}) => {
  const handleMinimize = () => runtime.WindowMinimise();
  const handleMaximize = () => runtime.WindowToggleMaximise();
  const handleClose = () => runtime.Quit();

  const [osName, setOsName] = useState<string>('windows');

  useEffect(() => {
    runtime.Environment().then((env) => {
      setOsName(env.platform);
    }).catch(() => {
      // fallback if not running in Wails
    });
  }, []);

  const [showBrandName, setShowBrandName] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBrandName(false);
    }, 4200);
    return () => clearTimeout(timer);
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    container.scrollLeft += e.deltaY;
  };

  const activeEnv = environments.find(e => e.ID === selectedEnvId);

  return (
    <div
      className="h-10 w-full flex items-center justify-between select-none border-b border-border bg-bg-secondary shrink-0 draggable"
    >
      {/* Left: Traffic Lights & Toggle */}
      <div className={`flex items-center gap-3 pr-1 h-full no-drag pl-4`}>
        {/* MacOS Traffic Lights */}
        {osName === 'darwin' && (
          <div className="flex items-center gap-1.5 mr-1">
            <div onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f57] cursor-pointer hover:opacity-80 transition-opacity" />
            <div onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#febc2e] cursor-pointer hover:opacity-80 transition-opacity" />
            <div onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#28c840] cursor-pointer hover:opacity-80 transition-opacity" />
          </div>
        )}

        {/* Brand Logo & Name */}
        <div
          className="flex items-center gap-1.5 cursor-pointer group"
          onClick={() => setShowBrandName(prev => !prev)}
        >
          <img src={logo} alt="HeAPI" className="w-[18px] h-[18px] rounded-[4px] object-cover transition-transform group-hover:scale-105" />
          <span
            className="font-extrabold text-[15px] text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden whitespace-nowrap"
            style={{
              fontFamily: '"Outfit", sans-serif',
              letterSpacing: '-0.02em',
              maxWidth: showBrandName ? '55px' : '0px',
              opacity: showBrandName ? 1 : 0,
              marginLeft: showBrandName ? '2px' : '0px',
              marginRight: showBrandName ? '8px' : '0px',
            }}
          >
            HeAPI
          </span>
        </div>

        <button
          onClick={onToggleSidebar}
          className="p-1 hover:bg-white/5 rounded transition-colors text-muted-foreground ml-1"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Center: Tabs Area */}
      <div
        className="flex-1 flex items-center h-full overflow-x-auto scrollbar-hide max-w-[90%] draggable border-l border-border/20 smooth-scroll"
        onWheel={handleWheel}
      >
        {tabs.map((tab) => (
          <div
            key={tab.ID}
            onClick={() => onSelectTab(tab.ID)}
            className={`
              flex items-center gap-2 px-4 h-full min-w-[140px] max-w-[200px] cursor-pointer border-r border-border/50 transition-all group no-drag relative
              ${activeTabId === tab.ID ? 'bg-background text-foreground' : 'bg-transparent text-muted-foreground hover:bg-white/5'}
            `}
          >
            {activeTabId === tab.ID && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary z-20 shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
            )}
            <span className={`text-${tab.method.toLowerCase()} text-[9px] font-extrabold min-w-[32px] tracking-wider`}>
              {tab.method === 'DELETE' ? 'DEL' : tab.method}
            </span>
            <span className="text-[11px] font-medium truncate flex-1">
              {tab.name || 'Untitled'}
              {tab.isDirty && <span className="ml-1 text-primary animate-pulse">●</span>}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(e, tab.ID);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded-sm transition-all text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Right: Env Selector, Terminal & Settings */}
      <div className="flex items-center gap-1 px-4 h-full no-drag">
        <EnvironmentSelector
          environments={environments}
          onSelect={onSelectEnv}
          selectedId={selectedEnvId}
          onOpenManager={onOpenEnvManager}
        />
        <div className="w-px h-4 bg-border/50 mx-1" />

        <button
          onClick={onToggleTerminal}
          className={`p-1.5 rounded-md transition-all ${isTerminalOpen ? 'text-accent-green bg-accent-green/10' : 'text-muted-foreground hover:bg-white/5'}`}
          title="Toggle Terminal"
        >
          <TerminalSquare size={16} />
        </button>

        <button
          onClick={onOpenSettings}
          className={`p-1.5 rounded-md transition-all ${activeTabId === 'settings' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-white/5'}`}
          title="Settings"
        >
          <Settings size={16} />
        </button>

        {/* Custom Window Controls for Windows & Linux */}
        {(osName === 'linux' || osName === 'windows') && (
          <div className="flex items-center ml-2 space-x-1 border-l border-border/50 pl-2">
            <button onClick={handleMinimize} className="p-1.5 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-foreground">
              <Minus size={14} />
            </button>
            <button onClick={handleMaximize} className="p-1.5 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-foreground">
              <Square size={12} />
            </button>
            <button onClick={handleClose} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors text-muted-foreground">
              <CloseIcon size={14} />
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .smooth-scroll {
          scroll-behavior: smooth;
        }
      `}} />
    </div>
  );
};

export default TitleBar;
