'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Shirt,
  CircleDot,
  Waves,
  BadgeCheck,
  Truck,
  Check,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export type WorkflowStatus = 'fabric_cutting' | 'stitching' | 'buttons' | 'steam_press' | 'complete' | 'delivered';

const STAGES: { id: WorkflowStatus; label: string; icon: React.ElementType }[] = [
  { id: 'fabric_cutting', label: 'Cutting', icon: Scissors },
  { id: 'stitching', label: 'Stitching', icon: Shirt },
  { id: 'buttons', label: 'Buttons', icon: CircleDot },
  { id: 'steam_press', label: 'Press', icon: Waves },
  { id: 'complete', label: 'Complete', icon: BadgeCheck },
  { id: 'delivered', label: 'Delivered', icon: Truck },
];

interface StitchAssignment {
  id: string | number;
  workflowStatus: WorkflowStatus | string;
  stitchTypeName: string;
}

interface WorkflowTrackerProps {
  invoiceId: string;
  stitchAssignments: StitchAssignment[];
  paymentStatus: string;
  dueAmount: number;
}

export function WorkflowTracker({ invoiceId, stitchAssignments, paymentStatus, dueAmount }: WorkflowTrackerProps) {
  const queryClient = useQueryClient();
  const [applyToAll, setApplyToAll] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    targetStatus: WorkflowStatus;
    assignmentIds: (string | number)[];
  } | null>(null);

  const updateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: (string | number)[]; status: WorkflowStatus }) => {
      const res = await fetch('/api/orders/workflow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stitchTypeIds: ids, status }),
      });
      if (!res.ok) throw new Error('Failed to update workflow');
      return res.json();
    },
    onMutate: async ({ ids, status }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previousOrders = queryClient.getQueryData(['orders']);
      
      // Optimistic update
      queryClient.setQueryData(['orders'], (old: any) => {
        if (!old?.orders) return old;
        return {
          ...old,
          orders: old.orders.map((o: any) => {
            if (o.id !== invoiceId) return o;
            return {
              ...o,
              items: o.items?.map((item: any) => ({
                ...item,
                stitchAssignments: item.stitchAssignments?.map((sa: any) => 
                  ids.includes(sa.id) ? { ...sa, workflowStatus: status } : sa
                )
              }))
            };
          })
        };
      });
      return { previousOrders };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  if (!stitchAssignments || stitchAssignments.length === 0) return null;

  const handleStatusChange = (status: WorkflowStatus, targetId: string | number) => {
    const rawIds = applyToAll ? stitchAssignments.map(s => s.id) : [targetId];
    const idsToUpdate = rawIds.filter((id): id is string | number => (typeof id === 'string' && id.length > 0) || typeof id === 'number');
    
    if (idsToUpdate.length === 0) return;

    if (status === 'complete' || status === 'delivered') {
      setConfirmModal({ open: true, targetStatus: status, assignmentIds: idsToUpdate });
    } else {
      updateMutation.mutate({ ids: idsToUpdate, status });
    }
  };

  const confirmStatusChange = () => {
    if (confirmModal) {
      updateMutation.mutate({ ids: confirmModal.assignmentIds, status: confirmModal.targetStatus });
      setConfirmModal(null);
    }
  };

  return (
    <div className="w-full bg-slate-50/50 dark:bg-slate-900/20 border border-border/50 rounded-2xl p-4 mt-2 mb-4">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Workflow Tracking</h4>
        {stitchAssignments.length > 1 && (
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-950 px-2 py-1.5 rounded-lg border shadow-sm">
            <Switch 
              id={`apply-all-${invoiceId}`} 
              checked={applyToAll} 
              onCheckedChange={setApplyToAll}
              className="scale-75"
            />
            <Label htmlFor={`apply-all-${invoiceId}`} className="text-[10px] font-bold cursor-pointer">Apply to all items</Label>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {stitchAssignments.map((assignment, idx) => {
          const currentStageIndex = STAGES.findIndex(s => s.id === (assignment.workflowStatus || 'fabric_cutting'));
          
          return (
            <div key={assignment.id || idx} className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-wider bg-white dark:bg-slate-950">
                  {assignment.stitchTypeName}
                </Badge>
              </div>

              <div className="w-full relative pb-6 pt-2">
                <div className="relative flex justify-between items-center w-full px-1 sm:px-4">
                {/* Background Line */}
                <div className="absolute left-[5%] right-[5%] top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 rounded-full z-0" />
                
                {/* Active Progress Line */}
                <motion.div 
                  className="absolute left-[5%] top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 origin-left"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, (currentStageIndex / (STAGES.length - 1)) * 90)}%` }}
                  transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                />

                {STAGES.map((stage, stageIdx) => {
                  const isActive = stage.id === assignment.workflowStatus;
                  const isCompleted = stageIdx <= currentStageIndex;
                  const Icon = stage.icon;

                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleStatusChange(stage.id, assignment.id)}
                      className="relative z-10 flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <motion.div
                        className={cn(
                          "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                          isActive 
                            ? "bg-primary border-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110" 
                            : isCompleted
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-primary/50"
                        )}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        
                        {isCompleted && !isActive && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-green-500 rounded-full flex items-center justify-center border border-white dark:border-slate-950"
                          >
                            <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                      <span className={cn(
                        "text-[6px] sm:text-[9px] font-bold uppercase tracking-tighter sm:tracking-normal whitespace-nowrap absolute -bottom-4 sm:-bottom-5",
                        isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {stage.label}
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={confirmModal?.open || false} onOpenChange={(o) => !o && setConfirmModal(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmModal?.targetStatus === 'delivered' ? <Truck className="w-5 h-5 text-emerald-500" /> : <BadgeCheck className="w-5 h-5 text-primary" />}
              Confirm Status Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to mark {confirmModal?.assignmentIds.length === 1 ? 'this item' : 'these items'} as <strong className="uppercase">{confirmModal?.targetStatus}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {confirmModal?.targetStatus === 'delivered' && dueAmount > 0 && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-3 flex items-start gap-3 mt-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-red-800 dark:text-red-300">Pending Payment Alert</h5>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  This order has a pending due amount of <strong>₹{dueAmount.toLocaleString()}</strong>.
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              className={cn(
                "rounded-xl font-bold text-white",
                confirmModal?.targetStatus === 'delivered' && dueAmount > 0 ? "bg-red-600 hover:bg-red-700" : "bg-primary"
              )}
            >
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
