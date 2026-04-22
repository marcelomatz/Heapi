import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check, Info, Code2 } from "lucide-react";
import type { Request, KeyValueItem, AuthConfig } from '../types';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
}

const RightSidebar = ({ isOpen, onClose, request }: RightSidebarProps) => {
  const [activeTab, setActiveTab] = useState('docs');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getActiveHeaders = (): KeyValueItem[] => {
    try {
      if (request?.headers) {
        return JSON.parse(request.headers).filter((h: KeyValueItem) => h.enabled && h.key);
      }
    } catch (e) {}
    return [];
  };

  const getAuthConfig = (): AuthConfig | null => {
    try {
      if (request?.auth_config) return JSON.parse(request.auth_config);
    } catch (e) {}
    return null;
  };

  const generateCurl = (): string => {
    if (!request) return '';
    let cmd = `curl -X ${request.method} "${request.url || ''}"`;
    
    getActiveHeaders().forEach(h => {
      cmd += ` \\\n  -H "${h.key}: ${h.value}"`;
    });

    const auth = getAuthConfig();
    if (auth?.type === 'bearer' && auth.token) {
      cmd += ` \\\n  -H "Authorization: Bearer ${auth.token}"`;
    } else if (auth?.type === 'basic' && auth.username) {
      const basicAuth = btoa(`${auth.username}:${auth.password || ''}`);
      cmd += ` \\\n  -H "Authorization: Basic ${basicAuth}"`;
    }

    if (request.body && request.method !== 'GET') {
      const escapedBody = request.body.replace(/"/g, '\\"');
      cmd += ` \\\n  -d "${escapedBody}"`;
    }
    return cmd;
  };

  const generateJsFetch = (): string => {
    if (!request) return '';
    const headersObj: Record<string, string> = {};
    getActiveHeaders().forEach(h => { headersObj[h.key] = h.value; });

    const auth = getAuthConfig();
    if (auth?.type === 'bearer' && auth.token) {
      headersObj['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth?.type === 'basic' && auth.username) {
      headersObj['Authorization'] = `Basic ${btoa(`${auth.username}:${auth.password || ''}`)}`;
    }

    const options: any = { method: request.method };
    if (Object.keys(headersObj).length > 0) {
      options.headers = headersObj;
    }
    if (request.body && request.method !== 'GET') {
      try {
        // tenta formatar se for json
        JSON.parse(request.body);
        options.body = "___BODY_PLACEHOLDER___";
      } catch(e) {
        options.body = request.body;
      }
    }

    let code = `fetch("${request.url || ''}", ${JSON.stringify(options, null, 2).replace(/"([^"]+)":/g, '$1:')});`;
    if (options.body === "___BODY_PLACEHOLDER___") {
       code = code.replace('"___BODY_PLACEHOLDER___"', `JSON.stringify(${request.body})`);
    }
    return code;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if(!open) onClose() }}>
      <SheetContent className="w-[350px] sm:w-[500px] p-0 flex flex-col border-l border-border bg-card/95 backdrop-blur-md">
        <SheetHeader className="p-4 border-b border-border/50 text-left shrink-0">
          <SheetTitle className="text-sm font-bold truncate pr-6">{request?.name || 'Request Details'}</SheetTitle>
          <SheetDescription className="sr-only">Documentation and snippets for the request</SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="flex bg-transparent border-b border-border/50 h-auto p-0 justify-start rounded-none px-4 shrink-0">
            <TabsTrigger 
              value="docs"
              className="px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary hover:bg-muted/50 text-muted-foreground"
            >
              Documentation
            </TabsTrigger>
            <TabsTrigger 
              value="snippets"
              className="px-4 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary hover:bg-muted/50 text-muted-foreground"
            >
              Snippets
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 custom-scrollbar">
            <div className="p-6">
              <TabsContent value="docs" className="m-0 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <span className={`text-[10px] font-black px-2 py-1 rounded-md bg-${request?.method?.toLowerCase() || 'get'}/10 text-${request?.method?.toLowerCase() || 'get'}`}>
                        {request?.method}
                     </span>
                     <code className="text-xs font-mono opacity-80 break-all">{request?.url}</code>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-border/30">
                   <div className="space-y-1.5">
                      <h4 className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest"><Info size={12}/> Request Name</h4>
                      <p className="text-xs text-foreground leading-relaxed font-medium">{request?.name || 'Untitled'}</p>
                   </div>
                   
                   <div className="space-y-1.5">
                      <h4 className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest"><Code2 size={12}/> Target URL</h4>
                      <code className="text-[10px] font-mono block bg-muted/30 p-3 rounded-lg border border-border/50 break-all text-primary/80">
                        {request?.url || 'N/A'}
                      </code>
                   </div>
                   
                   {request?.body && request.method !== 'GET' && (
                     <div className="space-y-1.5">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payload</h4>
                        <div className="text-[10px] font-mono bg-muted/20 p-3 rounded-lg border border-border/50 text-foreground/80 max-h-32 overflow-y-auto whitespace-pre-wrap custom-scrollbar">
                           {request.body}
                        </div>
                     </div>
                   )}
                </div>
              </TabsContent>

              <TabsContent value="snippets" className="m-0 space-y-6">
                <div className="space-y-2">
                   <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Code Generation</h4>
                   <p className="text-xs text-muted-foreground">Generate code snippets for various languages.</p>
                </div>
                
                <div className="space-y-4">
                   <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3 group">
                       <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                         <span className="uppercase tracking-widest">cURL</span>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => handleCopy(generateCurl(), 'curl')}
                         >
                            {copied === 'curl' ? <Check className="h-3 w-3 text-green-500"/> : <Copy className="h-3 w-3" />}
                         </Button>
                      </div>
                      <code className="text-[10px] font-mono block whitespace-pre-wrap opacity-80 text-foreground overflow-x-auto custom-scrollbar pb-2">
                        {generateCurl() || 'No data'}
                      </code>
                   </div>

                   <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3 group">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                         <span className="uppercase tracking-widest">JavaScript (Fetch)</span>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => handleCopy(generateJsFetch(), 'js')}
                         >
                            {copied === 'js' ? <Check className="h-3 w-3 text-green-500"/> : <Copy className="h-3 w-3" />}
                         </Button>
                      </div>
                      <code className="text-[10px] font-mono block whitespace-pre-wrap opacity-80 text-foreground overflow-x-auto custom-scrollbar pb-2">
                        {generateJsFetch() || 'No data'}
                      </code>
                   </div>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default RightSidebar;
