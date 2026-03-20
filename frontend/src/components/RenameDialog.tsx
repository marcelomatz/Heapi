import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3 } from "lucide-react";

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  title?: string;
  defaultValue?: string;
}

const RenameDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Rename", 
  defaultValue = "" 
}: RenameDialogProps) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] border-border/40 bg-card/95 backdrop-blur-xl p-0 shadow-2xl rounded-2xl">
        <div className="p-8 flex flex-col gap-6">
          {/* Central Icon Area */}
          <div className="flex justify-center">
            <div className="relative p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary shadow-sm group">
              <div className="absolute inset-0 blur-xl opacity-20 bg-primary group-hover:opacity-40 transition-opacity" />
              <Edit3 className="h-6 w-6 relative z-10" />
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-1.5 w-full text-center">
            <DialogTitle className="text-xl font-black tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Enter a new name for the item
            </DialogDescription>
          </div>

          {/* Input Area */}
          <div className="w-full">
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') onClose();
              }}
              className="h-11 bg-background/50 border-border/50 focus-visible:border-primary/50 text-center font-bold text-base rounded-xl transition-all shadow-inner"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              className="font-bold text-[10px] tracking-widest uppercase h-10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors border border-border/30 rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              className="font-black text-[10px] tracking-[0.15em] uppercase h-10 shadow-lg shadow-primary/20 transition-all active:scale-95 rounded-lg"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
