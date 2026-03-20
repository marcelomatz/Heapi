import { RefObject } from 'react';
import { Send } from "lucide-react";

interface RequestBarProps {
  method: string;
  onMethodChange: (method: string) => void;
  url: string;
  onUrlChange: (url: string) => void;
  showSuggestions: boolean;
  filteredMethods: string[];
  suggestionIdx: number;
  onSuggestionHover: (idx: number) => void;
  onSuggestionPick: (method: string) => void;
  onDismissSuggestions: () => void;
  onMethodClick: () => void;
  urlInputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  onSend: () => void;
  onSave: () => void;
}

const RequestBar = ({
  method, onMethodChange,
  url, onUrlChange,
  showSuggestions, filteredMethods, suggestionIdx, onSuggestionHover, onSuggestionPick, onDismissSuggestions,
  onMethodClick,
  urlInputRef,
  loading, onSend,
}: RequestBarProps) => (
  <div className="p-4 flex gap-2 items-center border-b border-border/50 bg-background">
    <div className="flex-1 flex bg-muted/30 border border-border/50 rounded-md group transition-all relative h-10">
      <div 
        className={`px-3 flex items-center gap-2 border-r border-border/50 cursor-pointer select-none transition-colors rounded-l-md
          ${method === 'GET' ? 'bg-emerald-500/10 text-emerald-500' : 
            method === 'POST' ? 'bg-amber-500/10 text-amber-500' :
            method === 'PUT' ? 'bg-blue-500/10 text-blue-500' :
            method === 'DELETE' ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'}`}
        onMouseDown={(e) => {
          // Prevent blur if input is focused
          if (document.activeElement === urlInputRef.current) {
            e.preventDefault();
          }
        }}
        onClick={onMethodClick}
      >
        <span className="text-[11px] font-bold w-10 text-center">{method}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>

      <input
        ref={urlInputRef as any}
        type="text"
        value={url}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUrlChange(e.target.value)}
        placeholder="Enter request URL..."
        className="flex-1 bg-transparent border-none outline-none text-[13px] px-3 font-mono text-foreground placeholder:text-muted-foreground/40"
        onBlur={() => setTimeout(onDismissSuggestions, 200)}
      />

      {showSuggestions && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border shadow-2xl rounded-md overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-1">
            {filteredMethods.map((m, idx) => (
              <button 
                key={m} 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSuggestionPick(m)} 
                onMouseEnter={() => onSuggestionHover(idx)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-[11px] font-bold transition-all ${idx === suggestionIdx ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
              >
                <span>{m}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>

    <button 
      onClick={onSend} 
      disabled={loading}
      className={`h-10 px-5 rounded-md font-bold text-[13px] flex items-center gap-2 transition-all shadow-[0_0_12px_var(--accent-purple-glow)] 
        ${loading ? 'opacity-50' : 'bg-primary text-white hover:opacity-90 active:scale-95'}`}
    >
      <Send size={16} />
      {loading ? 'Sending...' : 'Send'}
    </button>
  </div>
);

export default RequestBar;
