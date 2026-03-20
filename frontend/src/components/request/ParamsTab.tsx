import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { KeyValueItem } from '../../types';

interface ParamsTabProps {
  params: KeyValueItem[];
  onChange: (index: number, field: keyof KeyValueItem, value: string | boolean) => void;
  onRemove: (index: number) => void;
}

const ParamsTab = ({ params, onChange, onRemove }: ParamsTabProps) => (
  <div className="space-y-1">
    <div className="grid grid-cols-[30px_1fr_1.5fr_30px] gap-2 px-2 pb-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 mb-2">
      <div className="flex justify-center italic">#</div>
      <div>Key</div>
      <div>Value</div>
      <div />
    </div>
    {params.map((p, i) => (
      <div key={i} className="grid grid-cols-[30px_1fr_1.5fr_30px] gap-2 items-center group animate-in slide-in-from-left-1 duration-200 hover:bg-muted/10 rounded-lg p-1 transition-colors">
        <div className="flex justify-center">
          <input type="checkbox" checked={p.enabled} onChange={(e) => onChange(i, 'enabled', e.target.checked)} className="rounded-sm border-border bg-muted/50 w-3.5 h-3.5 cursor-pointer accent-primary" />
        </div>
        <Input placeholder="key" value={p.key} onChange={(e) => onChange(i, 'key', e.target.value)} className="bg-transparent border-none text-xs h-8 focus-visible:ring-0 px-1 placeholder:opacity-30" />
        <Input placeholder="value" value={p.value} onChange={(e) => onChange(i, 'value', e.target.value)} className="bg-transparent border-none text-xs h-8 focus-visible:ring-0 px-1 placeholder:opacity-30" />
        <Button variant="ghost" size="icon" onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-6 w-6 shrink-0 transition-opacity">
          <X className="h-3 w-3" />
        </Button>
      </div>
    ))}
  </div>
);

export default ParamsTab;
