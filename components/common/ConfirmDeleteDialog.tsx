'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertCircle, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
}

export function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Are you absolutely sure?",
  description = "This action cannot be undone. This will permanently delete the record from our servers.",
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-10 pt-10 pb-8 bg-red-50/50 dark:bg-red-950/10 border-b border-border/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <AlertDialogTitle className="text-2xl font-black tracking-tighter text-foreground italic">
                {title}
              </AlertDialogTitle>
              <div className="flex items-center gap-1.5 mt-1">
                <ShieldAlert className="w-3 h-3 text-red-500 opacity-60" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 opacity-60 italic">Irreversible Deletion Protocol</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-8">
          <AlertDialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed italic opacity-80">
            {description}
          </AlertDialogDescription>
        </div>
        
        <AlertDialogFooter className="px-10 pb-10 flex-col sm:flex-row gap-4">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              className="flex-1 rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] border-border/60 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border-2"
            >
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onOpenChange(false);
            }}
            asChild
          >
            <Button
              className="flex-1 rounded-2xl h-14 px-8 font-black italic shadow-2xl shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white text-lg tracking-tight hover:scale-[1.02] active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5" />
                Confirm
              </div>
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
