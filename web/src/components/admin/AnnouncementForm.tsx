"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createAnnouncementAction, updateAnnouncementAction } from "@/actions/admin/announcements";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AnnouncementFormProps {
    announcement?: {
        id: string;
        message: string;
        type: string;
        is_active: boolean;
        dismissible: boolean;
    };
    onSuccess?: () => void;
}

export function AnnouncementForm({ announcement, onSuccess }: AnnouncementFormProps) {
    const [isPending, startTransition] = useTransition();
    const [type, setType] = useState(announcement?.type || "info");
    const [isActive, setIsActive] = useState(announcement?.is_active ?? true);
    const [dismissible, setDismissible] = useState(announcement?.dismissible ?? true);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("type", type);
        formData.set("is_active", isActive ? "true" : "false");
        formData.set("dismissible", dismissible ? "true" : "false");

        startTransition(async () => {
            const result = announcement
                ? await updateAnnouncementAction(announcement.id, formData)
                : await createAnnouncementAction(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(announcement ? "Annonce mise à jour" : "Annonce créée");
                onSuccess?.();
            }
        });
    };

    const typeOptions = [
        { value: "info", label: "Info", color: "bg-blue-500" },
        { value: "warning", label: "Attention", color: "bg-amber-500" },
        { value: "success", label: "Succès", color: "bg-green-500" },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                    id="message"
                    name="message"
                    defaultValue={announcement?.message || ""}
                    rows={3}
                    required
                    placeholder="Écrivez votre annonce ici..."
                />
            </div>

            <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                    {typeOptions.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setType(opt.value)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${type === opt.value
                                ? "border-foreground/30 bg-muted text-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <Label htmlFor="is_active">Active</Label>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isActive}
                        onClick={() => setIsActive(!isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-orange-500" : "bg-muted"}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <Label htmlFor="dismissible">Peut être fermée</Label>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={dismissible}
                        onClick={() => setDismissible(!dismissible)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dismissible ? "bg-orange-500" : "bg-muted"}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dismissible ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {announcement ? "Mettre à jour" : "Créer l'annonce"}
            </Button>
        </form>
    );
}
