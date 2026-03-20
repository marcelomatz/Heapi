import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Terminal,
  Settings,
  Search,
  Send,
  FolderPlus,
  Sidebar as SidebarIcon,
  X,
  Globe
} from "lucide-react";

interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  perform: () => void;
  category: string;
}

interface CommandCenterProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actions: {
    onNewRequest: () => void;
    onNewCollection: () => void;
    onToggleTerminal: () => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
    onOpenEnvManager: () => void;
    onExecuteRequest: () => void;
  }
}

const CommandCenter = ({ isOpen, onOpenChange, actions }: CommandCenterProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allActions: Action[] = [
    { id: 'new-request', label: 'New Request', icon: <Plus size={16} />, shortcut: 'Ctrl+T', category: 'General', perform: actions.onNewRequest },
    { id: 'new-collection', label: 'New Collection', icon: <FolderPlus size={16} />, category: 'General', perform: actions.onNewCollection },
    { id: 'execute-request', label: 'Execute Current Request', icon: <Send size={16} />, category: 'Request', perform: actions.onExecuteRequest },
    { id: 'toggle-terminal', label: 'Toggle Terminal', icon: <Terminal size={16} />, shortcut: 'Ctrl+`', category: 'View', perform: actions.onToggleTerminal },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', icon: <SidebarIcon size={16} />, shortcut: 'Ctrl+B', category: 'View', perform: actions.onToggleSidebar },
    { id: 'manage-envs', label: 'Manage Environments', icon: <Globe size={16} />, category: 'System', perform: actions.onOpenEnvManager },
    { id: 'open-settings', label: 'Open Settings', icon: <Settings size={16} />, category: 'System', perform: actions.onOpenSettings },
  ];

  const filteredActions = allActions.filter(action =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].perform();
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none sm:max-w-2xl w-full top-[20%] translate-y-0">
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full animate-in zoom-in-95 duration-200">
          <div className="flex items-center px-4 border-b border-border/20 h-14 translate-y-0">
            <Search className="text-muted-foreground mr-3 h-5 w-5" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 text-base"
              autoFocus
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border/50 text-[10px] font-mono text-muted-foreground">
              ESC
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-2 custom-scrollbar">
            {filteredActions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <X className="opacity-20 h-10 w-10" />
                <p className="text-sm font-medium">No commands found for "{query}"</p>
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {['General', 'Request', 'View', 'System'].map(category => {
                  const catActions = filteredActions.filter(a => a.category === category);
                  if (catActions.length === 0) return null;
                  return (
                    <div key={category} className="space-y-1">
                      <h3 className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{category}</h3>
                      {catActions.map((action) => {
                        const globalIdx = filteredActions.indexOf(action);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <button
                            key={action.id}
                            onClick={() => { action.perform(); onOpenChange(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                                {action.icon}
                              </div>
                              <span className="text-sm font-bold">{action.label}</span>
                            </div>
                            {action.shortcut && (
                              <div className="px-2 py-1 rounded bg-muted border border-border/50 text-[10px] font-mono opacity-60">
                                {action.shortcut}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-bg-secondary/50 backdrop-blur-sm border-t border-border/20 flex items-center justify-between text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50 text-foreground/50">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50 text-foreground/50">ENTER</kbd> Execute</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-primary/40" />
               Contextual Actions
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandCenter;
