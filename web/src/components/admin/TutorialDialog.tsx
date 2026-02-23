"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TutorialForm } from "./TutorialForm";

interface TutorialDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tutorial?: {
        id: string;
        title: string;
        description: string | null;
        embed_code: string;
        is_active: boolean;
        is_featured: boolean;
        sort_order: number;
    };
}

export function TutorialDialog({ open, onOpenChange, tutorial }: TutorialDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{tutorial ? "Modifier le tutoriel" : "Nouveau tutoriel"}</DialogTitle>
                    <DialogDescription>
                        {tutorial ? "Modifiez les informations du tutoriel." : "Créez un nouveau tutoriel Arcade."}
                    </DialogDescription>
                </DialogHeader>
                <TutorialForm tutorial={tutorial} onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
