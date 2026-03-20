import React, { useState } from 'react';

interface JsonNodeProps {
  label: string | null;
  value: any;
  isLast?: boolean;
  depth?: number;
}

const JsonNode = ({ label, value, isLast = true, depth = 0 }: JsonNodeProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const renderValueSnippet = (val: any) => {
    if (val === null) return <span className="text-destructive font-bold italic">null</span>;
    if (typeof val === 'boolean') return <span className="text-secondary font-bold">{val.toString()}</span>;
    if (typeof val === 'number') return <span className="text-post font-mono">{val}</span>;
    if (typeof val === 'string') return <span className="text-get break-all">"{val}"</span>;
    return null;
  };

  if (!isObject) {
    return (
      <div className="flex gap-2 text-xs font-mono leading-relaxed" style={{ paddingLeft: depth === 0 ? '0' : '1.5rem' }}>
        {label && <span className="text-primary/70 shrink-0">"{label}"</span>}
        {label && <span className="text-muted-foreground/50">: </span>}
        {renderValueSnippet(value)}
        {!isLast && <span className="text-muted-foreground/50">,</span>}
      </div>
    );
  }

  const keys = Object.keys(value);
  const isEmpty = keys.length === 0;

  return (
    <div className={depth > 0 ? "border-l border-border/10 ml-2" : ""}>
      <div 
        className={`flex items-center gap-1 text-xs font-mono leading-relaxed group transition-colors ${!isEmpty ? 'cursor-pointer hover:bg-muted/10' : ''}`}
        onClick={() => !isEmpty && setIsOpen(!isOpen)}
        style={{ paddingLeft: depth === 0 ? '0' : '1rem' }}
      >
        {!isEmpty && (
          <span className={`text-[8px] transition-transform duration-200 text-muted-foreground/40 ${isOpen ? 'rotate-90' : ''}`}>
            ▶
          </span>
        )}
        <div className="flex items-center gap-1">
          {label && <span className="text-primary/70 shrink-0">"{label}"</span>}
          {label && <span className="text-muted-foreground/50">: </span>}
          <span className="text-muted-foreground/50">{isArray ? '[' : '{'}</span>
          {!isOpen && !isEmpty && <span className="text-[10px] px-1 bg-muted/20 rounded text-muted-foreground/40">...</span>}
          {(!isOpen || isEmpty) && <span className="text-muted-foreground/50">{isArray ? ']' : '}'}{!isLast && ','}</span>}
        </div>
      </div>
      
      {isOpen && !isEmpty && (
        <div className="animate-in fade-in slide-in-from-left-1 duration-200">
          {keys.map((key, i) => (
            <JsonNode 
              key={key} 
              label={isArray ? null : key} 
              value={value[key]} 
              isLast={i === keys.length - 1} 
              depth={depth + 1}
            />
          ))}
          <div className="text-xs font-mono leading-relaxed text-muted-foreground/50" style={{ paddingLeft: depth === 0 ? '0' : '1.5rem' }}>
            {isArray ? ']' : '}'}{!isLast && ','}
          </div>
        </div>
      )}
    </div>
  );
};

interface JsonViewerProps {
  data: any;
}

const JsonViewer = ({ data }: JsonViewerProps) => {
  if (!data) return null;

  let parsedData;
  try {
    parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    return <div className="p-6 text-xs font-mono text-destructive bg-destructive/5 rounded-lg border border-destructive/10 whitespace-pre-wrap">{data}</div>;
  }

  return (
    <div className="p-6 overflow-auto scrollbar-hide selection:bg-primary/20">
      <JsonNode value={parsedData} label={null} />
    </div>
  );
};

export default JsonViewer;
