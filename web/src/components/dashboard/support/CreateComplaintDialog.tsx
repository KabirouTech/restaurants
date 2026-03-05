"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { createComplaintAction, uploadComplaintFileAction } from "@/actions/complaints";
import { AudioRecorder } from "./AudioRecorder";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2, Image as ImageIcon, X } from "lucide-react";

interface CreateComplaintDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateComplaintDialog({ open, onOpenChange }: CreateComplaintDialogProps) {
    const t = useTranslations("dashboard.support");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Veuillez sélectionner une image.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image trop volumineuse (max 10MB).");
            return;
        }

        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadComplaintFileAction(formData);
            if (result.error) throw new Error(result.error);

            setPhotoUrl(result.url!);
        } catch (err: any) {
            console.error("Photo upload error:", err);
            toast.error("Erreur lors de l'upload de la photo.");
        } finally {
            setUploadingPhoto(false);
            if (photoInputRef.current) photoInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const result = await createComplaintAction({
            subject,
            description,
            photo_url: photoUrl,
            audio_url: audioUrl,
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(t("submitSuccess"));
            setSubject("");
            setDescription("");
            setPhotoUrl(null);
            setAudioUrl(null);
            onOpenChange(false);
        }
        setSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t("reportProblem")}</DialogTitle>
                    <DialogDescription>{t("subtitle")}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Subject */}
                    <div className="space-y-1.5">
                        <Label>{t("subject")}</Label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder={t("subjectPlaceholder")}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label>{t("description")}</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t("descriptionPlaceholder")}
                            rows={4}
                        />
                    </div>

                    {/* Photo */}
                    <div className="space-y-1.5">
                        <Label>{t("photo")}</Label>
                        {photoUrl ? (
                            <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden border border-border group">
                                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => setPhotoUrl(null)}>
                                        <X className="h-4 w-4 mr-1" /> Supprimer
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center gap-1 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => photoInputRef.current?.click()}
                            >
                                {uploadingPhoto ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <ImageIcon className="h-6 w-6 opacity-50" />
                                        <span className="text-xs">PNG, JPG, WEBP (Max 10MB)</span>
                                    </>
                                )}
                            </div>
                        )}
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Audio */}
                    <div className="space-y-1.5">
                        <Label>{t("audio")}</Label>
                        <AudioRecorder audioUrl={audioUrl} onAudioUrl={setAudioUrl} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                        {t("close")}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !subject.trim() || !description.trim()}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                {t("submitting")}
                            </>
                        ) : (
                            t("submit")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
