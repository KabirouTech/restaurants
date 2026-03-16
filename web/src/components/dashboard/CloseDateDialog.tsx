"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closeDateAction } from "@/actions/calendar";
import { toast } from "sonner";
import { Ban, Loader2 } from "lucide-react";

interface CloseDateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultDate?: string;
}

export function CloseDateDialog({ open, onOpenChange, defaultDate }: CloseDateDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [date, setDate] = useState(defaultDate || "");

    // Sync date state whenever the dialog opens with a new defaultDate
    useEffect(() => {
        if (open && defaultDate) setDate(defaultDate);
    }, [open, defaultDate]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await closeDateAction(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Date fermée avec succès");
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ban className="h-5 w-5 text-destructive" />
                        Fermer une date
                    </DialogTitle>
                    <DialogDescription>
                        Bloquez une date pour empêcher la prise de commandes.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="close-date">Date</Label>
                        <Input
                            id="close-date"
                            name="date"
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="close-reason">Raison (optionnel)</Label>
                        <Textarea
                            id="close-reason"
                            name="reason"
                            placeholder="Ex: Jour férié, Vacances, Événement privé..."
                            rows={2}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" variant="destructive" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Fermer cette date
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
