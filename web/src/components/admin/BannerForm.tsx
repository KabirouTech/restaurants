"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { createBannerAction, updateBannerAction } from "@/actions/admin/banners";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BannerFormProps {
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
    onSuccess?: () => void;
}

export function BannerForm({ banner, onSuccess }: BannerFormProps) {
    const [isPending, startTransition] = useTransition();
    const [imageUrl, setImageUrl] = useState(banner?.image_url || "");
    const [isActive, setIsActive] = useState(banner?.is_active ?? true);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("image_url", imageUrl);
        formData.set("is_active", isActive ? "true" : "false");

        startTransition(async () => {
            const result = banner
                ? await updateBannerAction(banner.id, formData)
                : await createBannerAction(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(banner ? "Bannière mise à jour" : "Bannière créée");
                onSuccess?.();
            }
        });
    };

    const formatDateForInput = (dateStr: string | null) => {
        if (!dateStr) return "";
        try {
            return new Date(dateStr).toISOString().slice(0, 16);
        } catch {
            return "";
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input id="title" name="title" defaultValue={banner?.title || ""} required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={banner?.description || ""} rows={3} />
            </div>

            <div className="space-y-2">
                <ImageUpload
                    name="image_url"
                    label="Image"
                    folder="banners"
                    defaultValue={banner?.image_url || undefined}
                    onUpload={setImageUrl}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="link_url">URL du lien</Label>
                <Input id="link_url" name="link_url" defaultValue={banner?.link_url || ""} placeholder="/dashboard/menu" />
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                        id="start_date"
                        name="start_date"
                        type="datetime-local"
                        defaultValue={formatDateForInput(banner?.start_date || null)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                        id="end_date"
                        name="end_date"
                        type="datetime-local"
                        defaultValue={formatDateForInput(banner?.end_date || null)}
                    />
                </div>
            </div>

            <Button type="submit" disabled={isPending} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {banner ? "Mettre à jour" : "Créer la bannière"}
            </Button>
        </form>
    );
}
