"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createTutorialAction, updateTutorialAction } from "@/actions/admin/tutorials";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TutorialFormProps {
    tutorial?: {
        id: string;
        title: string;
        description: string | null;
        embed_code: string;
        is_active: boolean;
        is_featured: boolean;
        sort_order: number;
    };
    onSuccess?: () => void;
}

export function TutorialForm({ tutorial, onSuccess }: TutorialFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isActive, setIsActive] = useState(tutorial?.is_active ?? true);
    const [isFeatured, setIsFeatured] = useState(tutorial?.is_featured ?? false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("is_active", isActive ? "true" : "false");
        formData.set("is_featured", isFeatured ? "true" : "false");

        startTransition(async () => {
            const result = tutorial
                ? await updateTutorialAction(tutorial.id, formData)
                : await createTutorialAction(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(tutorial ? "Tutoriel mis à jour" : "Tutoriel créé");
                onSuccess?.();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input id="title" name="title" defaultValue={tutorial?.title || ""} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={tutorial?.description || ""} rows={3} />
            </div>

            <div className="space-y-2">
                <Label htmlFor="embed_code">Code Embed (HTML) *</Label>
                <Textarea
                    id="embed_code"
                    name="embed_code"
                    defaultValue={tutorial?.embed_code || ""}
                    rows={5}
                    required
                    className="font-mono text-sm"
                    placeholder='<div style="position: relative; ..."><iframe src="..." ...></iframe></div>'
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="sort_order">Ordre d&apos;affichage</Label>
                <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={tutorial?.sort_order ?? 0}
                />
            </div>

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
                <Label htmlFor="is_featured">En vedette</Label>
                <button
                    type="button"
                    role="switch"
                    aria-checked={isFeatured}
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isFeatured ? "bg-orange-500" : "bg-muted"}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isFeatured ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className="text-xs text-muted-foreground">Affiché dans le hero de la homepage</span>
            </div>

            <Button type="submit" disabled={isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {tutorial ? "Mettre à jour" : "Créer le tutoriel"}
            </Button>
        </form>
    );
}
