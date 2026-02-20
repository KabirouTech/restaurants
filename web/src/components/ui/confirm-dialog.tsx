"use client";

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
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "destructive" | "default";
    onConfirm: () => void;
}

/**
 * A professional, accessible confirmation dialog using Radix AlertDialog.
 * Drop-in replacement for browser `confirm()`.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title = "Êtes-vous sûr ?",
    description = "Cette action est irréversible.",
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    variant = "destructive",
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[420px] gap-0 p-0 overflow-hidden">
                {/* Icon + Header */}
                <AlertDialogHeader className="px-6 pt-6 pb-4">
                    <div className="flex items-start gap-4">
                        {variant === "destructive" && (
                            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                        )}
                        <div>
                            <AlertDialogTitle className="text-base font-semibold text-foreground">
                                {title}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                {description}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                {/* Footer */}
                <AlertDialogFooter className="px-6 py-4 bg-muted/30 border-t border-border flex-row justify-end gap-2">
                    <AlertDialogCancel className="mt-0 h-9 px-4 text-sm font-medium border-border text-foreground hover:bg-muted/50">
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={
                            variant === "destructive"
                                ? "h-9 px-4 text-sm font-semibold bg-destructive hover:bg-destructive/90 text-white shadow-sm"
                                : "h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm"
                        }
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
