import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'destructive'
}: ConfirmDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[420px] border-border/40 bg-card/95 backdrop-blur-xl p-0 shadow-2xl rounded-2xl">
        <div className="p-8 flex flex-col gap-6">
          {/* Alert Icon Area */}
          <div className="flex justify-center">
            <div className={`relative p-4 rounded-xl border ${variant === 'destructive' ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-primary/20 bg-primary/5 text-primary'} shadow-sm group`}>
              <div className={`absolute inset-0 blur-xl opacity-20 ${variant === 'destructive' ? 'bg-destructive' : 'bg-primary'} group-hover:opacity-40 transition-opacity`} />
              <AlertTriangle className="h-6 w-6 relative z-10" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex flex-col gap-1.5 w-full text-center">
            <DialogTitle className="text-xl font-black tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground/70 leading-relaxed whitespace-pre-wrap">
              {description}
            </DialogDescription>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="font-bold text-[10px] tracking-widest uppercase h-10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors border border-border/30 rounded-lg"
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`font-black text-[10px] tracking-[0.15em] uppercase h-10 shadow-lg transition-all active:scale-95 rounded-lg ${variant === 'destructive' ? 'shadow-destructive/20' : 'shadow-primary/20'}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
