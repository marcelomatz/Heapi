import React from 'react';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, Terminal, Columns, Columns2, Github, BookOpen } from "lucide-react";

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
  return (
    <TooltipProvider>
      <footer className="h-7 border-t border-border/40 bg-card/10 backdrop-blur-md flex items-center justify-between px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest shrink-0 select-none relative z-50">

        {/* Left Section - Quick Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 group cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse" />
            <span className="group-hover:text-foreground/70 transition-colors">Engine Ready</span>
          </div>

          <Separator orientation="vertical" className="h-3 bg-border/30" />

          <div className="flex items-center gap-1.5 opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
            <Github className="h-3 w-3" />
            <span>main</span>
          </div>
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
            <span>Docs</span>
            <BookOpen className="h-3 w-3" />
          </button>

          <Separator orientation="vertical" className="h-3 bg-border/30" />

          <div className="flex items-center gap-1 text-[9px] opacity-40">
            <span>UTF-8</span>
          </div>
        </div>

      </footer>
    </TooltipProvider>
  );
};

export default Footer;
