import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Request } from '../types';

interface TabContainerProps {
  tabs: Request[];
  activeTabId: string | 'settings' | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (e: React.MouseEvent | null, id: string) => void;
}

const TabContainer = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: TabContainerProps) => {
  if (tabs.length === 0) return null;

  return (
    <div className="h-10 flex border-b border-border/40 bg-muted/20 overflow-x-auto scrollbar-hide shrink-0">
      {tabs.map(tab => (
        <div
          key={tab.ID}
          className={`group flex items-center gap-2 px-4 h-full border-r border-border cursor-pointer transition-all min-w-[140px] max-w-[220px] relative
            ${activeTabId === tab.ID ? 'bg-background font-medium' : 'hover:bg-muted text-muted-foreground'}`}
          onClick={() => onSelectTab(tab.ID)}
        >
          <span className={`text-[9px] font-black uppercase tracking-tighter shrink-0 text-${tab.method.toLowerCase()}`}>
            {tab.method}
          </span>
          <span className="text-xs truncate flex-1">{tab.name}</span>

          {tab.isDirty && (
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity ml-1"
            onClick={(e) => onCloseTab(e, tab.ID)}
          >
            <X className="h-3 w-3" />
          </Button>
          {activeTabId === tab.ID && <div className="tab-active-indicator"></div>}
        </div>
      ))}
    </div>
  );
};

export default TabContainer;
