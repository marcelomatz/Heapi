import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-http';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResponseResult } from '../types';

interface ResponseViewerProps {
  response: ResponseResult | null;
  loading: boolean;
}

const ResponseViewer = ({ response, loading }: ResponseViewerProps) => {
  const codeRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState('body');

  useEffect(() => {
    if (codeRef.current && response) {
      Prism.highlightElement(codeRef.current);
    }
  }, [response, activeTab]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span className="text-[11px] font-bold tracking-widest uppercase">Sending Request...</span>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground/30 italic text-xs">
        Send a request to see the response
      </div>
    );
  }

  const formatContent = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (e) {
      return text;
    }
  };

  const formattedContent = activeTab === 'body' ? formatContent(response.body) : JSON.stringify(response.headers, null, 2);
  const headersCount = Object.keys(response.headers || {}).length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/5 overflow-hidden">
      {/* Response Header */}
      <div className="flex items-center justify-between border-b border-border px-4 h-10 bg-bg shrink-0">
        <div className="flex gap-6 h-full items-center">
          <button
            onClick={() => setActiveTab('body')}
            className={`text-[11px] font-semibold h-full transition-all border-b-2 px-1
              ${activeTab === 'body' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`text-[11px] font-semibold h-full transition-all border-b-2 px-1
              ${activeTab === 'headers' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Headers <span className="opacity-50 text-[10px]">({headersCount})</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className={response.status_code < 400 ? 'text-accent-green' : 'text-destructive'}>
            {response.status_code} {response.status_code === 200 ? 'OK' : response.status_code === 201 ? 'Created' : ''}
          </span>
          <span className="text-muted-foreground">{response.duration} ms</span>
          <span className="text-muted-foreground">{new Blob([response.body]).size} B</span>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full h-full">
        <div className="p-4">
          <pre className="language-json !bg-transparent !m-0 !p-0 text-[12px] font-mono leading-relaxed">
            <code ref={codeRef} className="language-json">
              {formattedContent}
            </code>
          </pre>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResponseViewer;
