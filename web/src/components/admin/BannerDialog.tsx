"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BannerForm } from "./BannerForm";

interface BannerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    banner?: {
        id: string;
        title: string;
        description: string | null;
        image_url: string | null;
        link_url: string | null;
        is_active: boolean;
        start_date: string | null;
        end_date: string | null;
    };
}

export function BannerDialog({ open, onOpenChange, banner }: BannerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{banner ? "Modifier la bannière" : "Nouvelle bannière"}</DialogTitle>
                    <DialogDescription>
                        {banner ? "Modifiez les informations de la bannière." : "Créez une nouvelle bannière pour le dashboard."}
                    </DialogDescription>
                </DialogHeader>
                <BannerForm banner={banner} onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
