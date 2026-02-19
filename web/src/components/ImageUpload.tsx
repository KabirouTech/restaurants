"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
    name: string;
    defaultValue?: string;
    label?: string;
    folder?: string;
    onUpload?: (url: string) => void;
}


export function ImageUpload({ name, defaultValue, label, folder = "uploads", onUpload }: ImageUploadProps) {

    const [preview, setPreview] = useState<string | null>(defaultValue || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith("image/")) {
            toast.error("Veuillez sélectionner une image valide.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("L'image est trop volumineuse (max 5MB).");
            return;
        }

        setUploading(true);
        const supabase = createClient();

        try {
            // Create a unique filename
            const timestamp = Date.now();
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('organizations') // Enforce 'organizations' bucket
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error("Supabase storage error:", error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('organizations')
                .getPublicUrl(fileName);

            setPreview(publicUrl);
            onUpload?.(publicUrl);
            toast.success("Image téléchargée avec succès !");

        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Erreur lors du téléchargement: " + (error.message || "Erreur inconnue"));
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUpload?.("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };


    return (
        <div className="space-y-2">
            {label && <Label htmlFor={`file-${name}`}>{label}</Label>}

            <div className="flex flex-col gap-4">
                {/* Hidden Input for Form Submission */}
                <input type="hidden" name={name} value={preview || ""} />

                {preview ? (
                    <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-border group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4 mr-2" /> Supprimer
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImageIcon className="h-10 w-10 opacity-50" />
                        <span className="text-sm font-medium">Cliquez pour choisir une image</span>
                        <span className="text-xs opacity-70">PNG, JPG, WEBP (Max 5MB)</span>
                    </div>
                )}

                {/* File Input (Hidden but functional) */}
                <input
                    ref={fileInputRef}
                    id={`file-${name}`}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                />

                {uploading && (
                    <div className="space-y-1">
                        <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary animate-pulse w-full"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-center animate-pulse">
                            Téléchargement...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
