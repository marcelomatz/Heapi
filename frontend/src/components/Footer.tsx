import React, { useEffect, useState } from 'react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, Terminal, Columns, Columns2, Github, BookOpen, Activity } from "lucide-react";
import { GetVersion } from '../../wailsjs/go/main/App';

interface FooterProps {
  isLeftOpen: boolean;
  onToggleLeft: () => void;
  isRightOpen: boolean;
  onToggleRight: () => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  envName: string | null;
}

const Footer = ({
  isLeftOpen,
  onToggleLeft,
  isRightOpen,
  onToggleRight,
  isTerminalOpen,
  onToggleTerminal,
  isSplitView,
  onToggleSplitView,
  envName,
}: FooterProps) => {
  const [version, setVersion] = useState<string>('dev');

  useEffect(() => {
    GetVersion()
      .then(v => setVersion(v))
      .catch(console.error);
  }, []);

  return (
    <TooltipProvider>
      <footer className="h-7 border-t border-border/40 bg-card/10 backdrop-blur-md flex items-center justify-between px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest shrink-0 select-none relative z-50">

        {/* Left Section - Empty to balance flex layout if needed, though center is absolute */}
        <div className="flex items-center gap-4 w-20">
        </div>

        {/* Center Section - Environment */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-0.5 rounded-full bg-primary/5 border border-primary/10 shadow-sm transition-all hover:bg-primary/10 cursor-pointer group">
          <div className={`w-1 h-1 rounded-full ${envName ? 'bg-primary shadow-[0_0_5px_rgba(124,58,237,0.5)]' : 'bg-muted-foreground/30'}`} />
          <span className="text-[9px] text-primary/80 group-hover:text-primary transition-colors tracking-[0.15em]">
            {envName || 'No Context'}
          </span>
        </div>

        {/* Right Section - Meta & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleRight}
            className={`flex items-center gap-2 transition-all hover:text-foreground ${isRightOpen ? 'text-primary' : 'text-muted-foreground/60'}`}
          >
            <span>Docs & Snippets</span>
            <BookOpen className="h-3 w-3" />
          </button>
        </div>

      </footer>
    </TooltipProvider>
  );
};

export default Footer;
