import React, { useState } from 'react';
import CollectionsPanel from './CollectionsPanel';
import { Search, Plus } from "lucide-react";
import type { Environment, Request } from '../types';

interface SidebarProps {
  width?: number;
  onSelectRequest: (request: Request | (Partial<Request> & { ID: string })) => void;
  selectedRequestId: string | null;
  onDeleteRequest: (id: string) => void;
  onDeleteCollection: (requests: Request[]) => void;
  onRefreshSidebar: () => void;
  onNewCollection: () => void;
}

const Sidebar = ({
  width = 240,
  onSelectRequest,
  selectedRequestId,
  onDeleteRequest,
  onDeleteCollection,
  onRefreshSidebar,
  onNewCollection,
}: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <aside 
      style={{ width: `${width}px` }} 
      className="flex flex-col border-r border-border shrink-0 select-none bg-bg-secondary overflow-hidden animate-in slide-in-from-left duration-300"
    >
      {/* Search & Add Bar */}
      <div className="p-3 border-b border-border/50 flex gap-2">
        <div className="flex-1 bg-background border border-border/50 rounded-md flex items-center px-2 py-1 gap-2 group hover:border-border-hover transition-all">
          <Search size={14} className="text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Filter..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] w-full text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
        <button 
          className="bg-background border border-border/50 rounded-md w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border-hover transition-all"
          onClick={onNewCollection}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <CollectionsPanel
          searchTerm={searchTerm}
          onSelectRequest={onSelectRequest as any}
          selectedRequestId={selectedRequestId}
          onDeleteRequest={onDeleteRequest}
          onDeleteCollection={onDeleteCollection}
          onRefreshSidebar={onRefreshSidebar}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
