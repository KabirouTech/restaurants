"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AnnouncementForm } from "./AnnouncementForm";

interface AnnouncementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    announcement?: {
        id: string;
        message: string;
        type: string;
        is_active: boolean;
        dismissible: boolean;
    };
}

export function AnnouncementDialog({ open, onOpenChange, announcement }: AnnouncementDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{announcement ? "Modifier l'annonce" : "Nouvelle annonce"}</DialogTitle>
                    <DialogDescription>
                        {announcement ? "Modifiez les informations de l'annonce." : "Créez une nouvelle annonce pour le dashboard."}
                    </DialogDescription>
                </DialogHeader>
                <AnnouncementForm announcement={announcement} onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
