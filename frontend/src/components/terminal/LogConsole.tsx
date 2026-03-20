import { useEffect, useRef, useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { LogEntry } from '../../types';

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

const LogConsole = ({ logs, onClear }: LogConsoleProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  return (
    <div className={`shrink-0 border-t border-border/40 bg-black/20 backdrop-blur-md transition-all duration-300 ${isExpanded ? 'h-32' : 'h-7'}`}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-3 h-7 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
          <Activity size={10} className={logs.some(l => l.type === 'error') ? 'text-destructive' : ''} />
          Terminal Debug Console {logs.length > 0 && <span className="opacity-40">({logs.length})</span>}
        </div>
        <div className="flex items-center gap-3">
          {isExpanded && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="p-1 hover:text-destructive transition-colors"
              title="Clear Logs"
            >
              <Trash2 size={10} />
            </button>
          )}
          {isExpanded ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </div>
      </div>
      {isExpanded && (
        <div ref={scrollRef} className="overflow-y-auto h-[100px] p-2 font-mono text-[10px] leading-normal selection:bg-primary/20">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground/20 italic tracking-tighter uppercase">No diagnostic data</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex gap-2 py-0.5 border-b border-white/[0.02]">
                <span className="text-muted-foreground/30 shrink-0 font-light">[{log.time}]</span>
                <span className={`break-all ${
                  log.type === 'error'   ? 'text-destructive font-bold' :
                  log.type === 'warn'    ? 'text-yellow-500/80' :
                  log.type === 'success' ? 'text-emerald-400' : 'text-primary/60'
                }`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LogConsole;
