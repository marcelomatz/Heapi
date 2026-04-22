import React, { useState } from 'react';
import CollectionsPanel from './CollectionsPanel';
import { Search, Plus, Command } from "lucide-react";
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
      <div className="p-3 flex gap-2 border-b border-border">
        <div className="flex-1 bg-white/5 rounded-md flex items-center px-2 py-1.5 gap-2 group hover:bg-white/10 transition-all cursor-pointer">
          <Search size={12} className="text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-[12px] w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button 
          className="bg-primary rounded-md w-[28px] h-[28px] flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
          onClick={onNewCollection}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
        <CollectionsPanel
          searchTerm={searchTerm}
          onSelectRequest={onSelectRequest as any}
          selectedRequestId={selectedRequestId}
          onDeleteRequest={onDeleteRequest}
          onDeleteCollection={onDeleteCollection}
          onRefreshSidebar={onRefreshSidebar}
        />
      </div>

      {/* Bottom info */}
      <div className="p-2 border-t border-border flex items-center gap-2">
         <Command size={12} className="text-muted-foreground" />
         <span className="text-[10px] text-muted-foreground">CMD + K to search</span>
      </div>
    </aside>
  );
};

export default Sidebar;
