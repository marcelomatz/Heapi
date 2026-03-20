import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import type { Request } from '../types';

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
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">No description provided for this request.</p>
                   </div>
                   
                   <div className="space-y-1.5">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base URL</h4>
                      <code className="text-[10px] font-mono block bg-muted/30 p-3 rounded-lg border border-border/50 break-all text-primary">
                        {request?.url?.split('?')[0] || 'N/A'}
                      </code>
                   </div>
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
                            onClick={() => handleCopy(`curl -X ${request?.method} "${request?.url}" \\\n-H "Content-Type: application/json"`, 'curl')}
                         >
                            {copied === 'curl' ? <Check className="h-3 w-3 text-green-500"/> : <Copy className="h-3 w-3" />}
                         </Button>
                      </div>
                      <code className="text-xs font-mono block break-all opacity-80 text-foreground">
                        curl -X {request?.method} "{request?.url}" \
                        <br/>-H "Content-Type: application/json"
                      </code>
                   </div>

                   <div className="p-4 rounded-xl bg-muted/20 border border-border/50 space-y-3 group">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                         <span className="uppercase tracking-widest">JavaScript (Fetch)</span>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                            onClick={() => handleCopy(`fetch("${request?.url}", { method: "${request?.method}" })`, 'js')}
                         >
                            {copied === 'js' ? <Check className="h-3 w-3 text-green-500"/> : <Copy className="h-3 w-3" />}
                         </Button>
                      </div>
                      <code className="text-xs font-mono block break-all opacity-80 text-foreground">
                        fetch("{request?.url}", &#123; method: "{request?.method}" &#125;)
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
