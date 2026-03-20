import { useState, useEffect, useRef, useCallback } from 'react';
import { updateRequest, executeRequest } from '../api';
import ResponseViewer from './ResponseViewer';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import RequestBar from './request/RequestBar';
import ParamsTab from './request/ParamsTab';
import HeadersTab from './request/HeadersTab';
import AuthTab from './request/AuthTab';
import type { Request, AuthConfig, KeyValueItem, ResponseResult } from '../types';

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const EMPTY_ROW = (): KeyValueItem => ({ key: '', value: '', enabled: true });

function parseHeaders(raw: string): KeyValueItem[] {
  try {
    const h = JSON.parse(raw || '[]');
    if (Array.isArray(h)) return h.length > 0 ? h : [EMPTY_ROW()];
    return Object.entries(h as Record<string, string>).map(([key, value]) => ({ key, value, enabled: true })).concat([EMPTY_ROW()]);
  } catch { return [EMPTY_ROW()]; }
}

function parseAuth(raw: string): AuthConfig {
  try { return JSON.parse(raw || '{"type":"none"}') as AuthConfig; }
  catch { return { type: 'none' }; }
}

interface RequestPanelProps {
  request: Request;
  selectedEnvId: string | null;
  isSplitView: boolean;
  onRefreshSidebar: () => void;
  onUpdateTab: (id: string, updates: Partial<Request>) => void;
  onUpdateTabState: (id: string, updates: Partial<Request>) => void;
  onSave: (id: string) => void;
}

const RequestPanel = ({ request, selectedEnvId, isSplitView, onRefreshSidebar, onUpdateTab, onUpdateTabState, onSave }: RequestPanelProps) => {
  const [name, setName] = useState(request.name ?? '');
  const [url, setUrl] = useState(request.url ?? '');
  const [method, setMethod] = useState(request.method ?? 'GET');
  const [body, setBody] = useState(request.body ?? '');
  const [activeTab, setActiveTab] = useState('params');
  const [respTab, setRespTab] = useState('pretty');
  const [response, setResponse] = useState<ResponseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<KeyValueItem[]>([]);
  const [headers, setHeaders] = useState<KeyValueItem[]>(() => parseHeaders(request.headers));
  const [auth, setAuth] = useState<AuthConfig>(() => parseAuth(request.auth_config));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [filteredMethods, setFilteredMethods] = useState(ALL_METHODS);
  
  // Resize logic
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    const saved = localStorage.getItem(`requestPanelSplit_${request.ID}`);
    if (saved) return parseFloat(saved);
    
    // Fallback to global setting if exists, or 50
    const globalSaved = localStorage.getItem('requestPanelSplit');
    return globalSaved ? parseFloat(globalSaved) : 50;
  }); // percentage
  const isResizingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(`requestPanelSplit_${request.ID}`, leftWidth.toString());
    // Also update the global one as the "preferred default" for new tabs
    localStorage.setItem('requestPanelSplit', leftWidth.toString());
  }, [leftWidth, request.ID]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.addEventListener('mousemove', handleResizing);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleResizing);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, []);

  const handleResizing = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const container = document.getElementById('request-panel-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setLeftWidth(newWidth);
    }
  }, []);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const prevSavedRef = useRef({
    name: request.name,
    method: request.method,
    url: request.url,
    headers: request.headers,
    body: request.body,
    auth_config: request.auth_config
  });

  // ── Sync when request changes ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
      const sp = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({ key, value, enabled: true }));
      setParams(sp.length > 0 ? [...sp, EMPTY_ROW()] : [EMPTY_ROW()]);
    } catch { /* noop */ }
  }, [request.ID]);

  useEffect(() => {
    setUrl(request.url);
    setMethod(request.method);
    setBody(request.body);
    setHeaders(parseHeaders(request.headers));
    setAuth(parseAuth(request.auth_config));
    setName(request.name);
    
    prevSavedRef.current = {
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      auth_config: request.auth_config
    };

    const body = request.lastResponse ?? request.last_response;
    const status = request.lastStatusCode ?? request.last_status_code;
    const duration = request.lastDuration ?? request.last_duration;
    let hdrs: Record<string, string> | string = request.lastHeaders ?? request.last_headers ?? {};
    if (typeof hdrs === 'string') { try { hdrs = JSON.parse(hdrs); } catch { hdrs = {}; } }

    setResponse(body ? { body, status_code: status ?? 200, duration: duration ?? 0, headers: hdrs } : null);
    setRespTab('pretty');
  }, [request.ID, request.name, request.lastResponse, request.last_response]);

  useEffect(() => {
    if (!['POST', 'PUT', 'PATCH'].includes(method) && activeTab === 'body') setActiveTab('headers');
  }, [method]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getHeadersJson = useCallback((hSet = headers) =>
    JSON.stringify(hSet.filter(h => h.key.trim() !== '')),
    [headers]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleHeaderChange = (index: number, field: keyof KeyValueItem, value: string | boolean) => {
    const h = [...headers];
    (h[index] as unknown as Record<string, unknown>)[field] = value;
    if (index === h.length - 1 && field !== 'enabled' && value !== '') h.push(EMPTY_ROW());
    setHeaders(h);
    if (request) onUpdateTab(request.ID, { headers: getHeadersJson(h) });
  };
  const removeHeader = (index: number) => {
    const h = headers.filter((_, i) => i !== index);
    setHeaders(h.length > 0 ? h : [EMPTY_ROW()]);
  };

  const applyParamsToUrl = (newParams: KeyValueItem[]) => {
    try {
      const base = url.split('?')[0];
      const qs = new URLSearchParams();
      newParams.forEach(p => { if (p.enabled && p.key.trim()) qs.append(p.key, p.value); });
      const newUrl = base + (qs.toString() ? '?' + qs.toString() : '');
      setUrl(newUrl);
      onUpdateTab(request.ID, { url: newUrl });
      onRefreshSidebar();
    } catch { /* noop */ }
  };
  const handleParamChange = (index: number, field: keyof KeyValueItem, value: string | boolean) => {
    const p = [...params];
    (p[index] as unknown as Record<string, unknown>)[field] = value;
    if (index === p.length - 1 && field !== 'enabled' && value !== '') p.push(EMPTY_ROW());
    setParams(p);
    applyParamsToUrl(p);
  };
  const removeParam = (index: number) => {
    const p = params.filter((_, i) => i !== index);
    setParams(p.length > 0 ? p : [EMPTY_ROW()]);
    applyParamsToUrl(p);
  };

  const handleUrlChange = (newUrl: string) => {
    if (newUrl.startsWith('/')) {
      const query = newUrl.slice(1).toUpperCase().trim();
      const slashCmds = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      
      // Direct match handling
      if (slashCmds.includes(query)) {
        handleMethodChange(query);
        setUrl(''); setShowSuggestions(false);
        onUpdateTab(request.ID, { url: '' });
        return;
      }

      const filtered = ALL_METHODS.filter(m => m.startsWith(query));
      setFilteredMethods(filtered.length > 0 ? filtered : ALL_METHODS);
      setSuggestionIdx(0);
      setShowSuggestions(true);
      setUrl(newUrl);
      return;
    } else { setShowSuggestions(false); }

    setUrl(newUrl);
    try {
      const urlObj = new URL(newUrl.startsWith('http') ? newUrl : `http://${newUrl}`);
      const sp = Array.from(urlObj.searchParams.entries()).map(([key, value]) => ({ key, value, enabled: true }));
      setParams([...sp, EMPTY_ROW()]);
    } catch { /* noop */ }
    onUpdateTab(request.ID, { url: newUrl });
    onRefreshSidebar();
  };

  const handleMethodClick = () => {
    setFilteredMethods(ALL_METHODS);
    setSuggestionIdx(0);
    setShowSuggestions(!showSuggestions);
  };

  const handleMethodChange = (m: string) => {
    setMethod(m);
    onUpdateTab(request.ID, { method: m });
    onRefreshSidebar();
  };

  const handleSuggestionPick = (m: string) => {
    handleMethodChange(m);
    if (url.startsWith('/')) {
      setUrl('');
      onUpdateTab(request.ID, { url: '' });
    }
    setShowSuggestions(false);
  };

  const handleAuthChange = (newAuth: AuthConfig) => {
    setAuth(newAuth);
    onUpdateTab(request.ID, { auth_config: JSON.stringify(newAuth) });
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await executeRequest(request.ID, method, url, getHeadersJson(), body, JSON.stringify(auth), selectedEnvId);
      setResponse(res);
      const responseData: Partial<Request> = {
        lastResponse: res.body, lastStatusCode: res.status_code, lastDuration: res.duration,
        lastHeaders: typeof res.headers === 'string' ? res.headers : JSON.stringify(res.headers),
      };
      onUpdateTabState(request.ID, responseData);
      onRefreshSidebar();
    } catch (err) {
      setResponse({ body: JSON.stringify({ error: String(err) }), status_code: 0, duration: 0, headers: {} });
    } finally { setLoading(false); }
  };

  // Debounced auto-save
  useEffect(() => {
    const currentHeaders = getHeadersJson();
    const currentAuth = JSON.stringify(auth);
    
    const hasChanged = 
      name !== prevSavedRef.current.name ||
      method !== prevSavedRef.current.method ||
      url !== prevSavedRef.current.url ||
      currentHeaders !== prevSavedRef.current.headers ||
      body !== prevSavedRef.current.body ||
      currentAuth !== prevSavedRef.current.auth_config;

    if (!hasChanged) return;

    const timer = setTimeout(async () => {
      const lastRes = response?.body ?? '';
      const lastStatus = response?.status_code ?? 0;
      const lastDur = response?.duration ?? 0;
      const lastHeaders = typeof response?.headers === 'string' ? response.headers : JSON.stringify(response?.headers ?? {});
      
      const ok = await updateRequest(
        request.ID, name, method, url, currentHeaders, body, currentAuth, 
        lastRes, lastStatus, lastDur, lastHeaders
      );

      if (ok) {
        prevSavedRef.current = {
          name, method, url, headers: currentHeaders, body, auth_config: currentAuth
        };
        onRefreshSidebar();
      }
    }, 1000); // 1s debounce for auto-save

    return () => clearTimeout(timer);
  }, [name, method, url, headers, body, auth, response]);

  const handleSave = useCallback(async () => {
    const currentHeaders = getHeadersJson();
    const currentAuth = JSON.stringify(auth);
    const lastRes = response?.body ?? '';
    const lastStatus = response?.status_code ?? 0;
    const lastDur = response?.duration ?? 0;
    const lastHeaders = typeof response?.headers === 'string' ? response.headers : JSON.stringify(response?.headers ?? {});
    
    await updateRequest(request.ID, name, method, url, currentHeaders, body, currentAuth, lastRes, lastStatus, lastDur, lastHeaders);
    
    prevSavedRef.current = {
      name, method, url, headers: currentHeaders, body, auth_config: currentAuth
    };
    
    onRefreshSidebar();
    onSave(request.ID);
    onUpdateTabState(request.ID, { name, method, url, headers: currentHeaders, body, auth_config: currentAuth, lastResponse: lastRes, lastStatusCode: lastStatus, lastDuration: lastDur, lastHeaders });
  }, [request.ID, name, method, url, headers, body, auth, response]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const modifier = e.ctrlKey || e.metaKey;
      if (modifier && e.key.toLowerCase() === 's') { e.preventDefault(); handleSave(); }
      else if (modifier && e.key.toLowerCase() === 'l') { e.preventDefault(); urlInputRef.current?.focus(); urlInputRef.current?.select(); }
      else if (showSuggestions) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIdx(p => (p + 1) % filteredMethods.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIdx(p => (p - 1 + filteredMethods.length) % filteredMethods.length); }
        else if (e.key === 'Enter') { e.preventDefault(); handleMethodChange(filteredMethods[suggestionIdx]); setUrl(''); setShowSuggestions(false); onUpdateTab(request.ID, { url: '' }); }
        else if (e.key === 'Escape') setShowSuggestions(false);
      }
    };
    const focusUrl = () => { urlInputRef.current?.focus(); urlInputRef.current?.select(); };
    const sendReq = () => handleSend();
    window.addEventListener('keydown', handler);
    window.addEventListener('request:focus-url', focusUrl);
    window.addEventListener('request:send', sendReq);
    return () => { 
      window.removeEventListener('keydown', handler); 
      window.removeEventListener('request:focus-url', focusUrl); 
      window.removeEventListener('request:send', sendReq); 
    };
  }, [handleSave, showSuggestions, filteredMethods, suggestionIdx]);

  const responseHeaders = (response?.headers ?? {}) as Record<string, string>;

  return (
    <div className="flex flex-col h-full min-w-0 bg-background overflow-hidden relative">
      <RequestBar
        method={method} onMethodChange={handleMethodChange}
        url={url} onUrlChange={handleUrlChange}
        showSuggestions={showSuggestions} filteredMethods={filteredMethods}
        suggestionIdx={suggestionIdx} onSuggestionHover={setSuggestionIdx}
        onSuggestionPick={handleSuggestionPick}
        onDismissSuggestions={() => setShowSuggestions(false)}
        onMethodClick={handleMethodClick}
        urlInputRef={urlInputRef}
        loading={loading} onSend={handleSend} onSave={handleSave}
      />

      <div id="request-panel-container" className="flex-1 overflow-hidden flex flex-row relative">
        {/* Left: Request Config */}
        <div 
          style={{ 
            width: `${leftWidth}%`,
            transition: isResizingRef.current ? 'none' : 'width 0.3s ease-out'
          }} 
          className="border-r border-border flex flex-col min-w-0 bg-bg"
        >
          <div className="flex border-b border-border/50 px-4 gap-6 shrink-0 h-10 items-center">
            {[
              { id: 'params', label: 'Params' },
              { id: 'headers', label: `Headers (${headers.filter(h => h.key.trim() !== '').length})` },
              { id: 'auth', label: 'Auth' },
              { id: 'body', label: 'Body' }
            ]
              .filter(t => t.id !== 'body' || ['POST', 'PUT', 'PATCH'].includes(method))
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`text-[11px] font-semibold h-full transition-all border-b-2 px-1
                    ${activeTab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                  {t.label}
                </button>
              ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'params' && <ParamsTab params={params} onChange={handleParamChange} onRemove={removeParam} />}
            {activeTab === 'headers' && <HeadersTab headers={headers} onChange={handleHeaderChange} onRemove={removeHeader} />}
            {activeTab === 'auth' && <AuthTab auth={auth} onChange={handleAuthChange} />}
            {activeTab === 'body' && (
              <div className="flex flex-col h-full gap-2">
                <div className="flex gap-4 text-[10px] text-muted-foreground">
                  <span className="text-foreground">raw</span>
                  <span className="cursor-pointer">JSON <svg className="inline" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
                </div>
                <Textarea 
                  value={body} 
                  onChange={(e) => { setBody(e.target.value); onUpdateTab(request.ID, { body: e.target.value }); }}
                  placeholder='{"example": "json"}' 
                  className="w-full flex-1 bg-transparent border-none text-[12px] font-mono focus-visible:ring-0 resize-none leading-relaxed p-0" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className={`absolute top-0 bottom-0 w-1 hover:bg-primary/50 cursor-col-resize z-20 transition-colors ${isResizingRef.current ? 'bg-primary/30' : ''}`}
          style={{ left: `calc(${leftWidth}% - 0.5px)` }}
        />

        {/* Right: Response Viewer */}
        <div 
          style={{ 
            width: `${100 - leftWidth}%`,
            transition: isResizingRef.current ? 'none' : 'width 0.3s ease-out'
          }} 
          className="flex flex-col bg-muted/5 min-w-0 overflow-hidden"
        >
          <ResponseViewer response={response} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default RequestPanel;
