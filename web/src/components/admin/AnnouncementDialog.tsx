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
        link_url?: string | null;
        link_label?: string | null;
        starts_at?: string | null;
        expires_at?: string | null;
        priority?: number;
        emoji?: string | null;
        animation?: string | null;
        position?: string | null;
        display_format?: string | null;
    };
}

export function AnnouncementDialog({ open, onOpenChange, announcement }: AnnouncementDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
