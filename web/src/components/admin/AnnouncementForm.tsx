"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createAnnouncementAction, updateAnnouncementAction } from "@/actions/admin/announcements";
import {
    announcementColors, announcementAnimations, announcementPositions, announcementFormats,
    getAnimationClass, getBarStyle, getFormatClasses,
} from "@/lib/announcement-styles";
import { toast } from "sonner";
import { Loader2, X, ExternalLink } from "lucide-react";

interface AnnouncementFormProps {
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
    onSuccess?: () => void;
}

export function AnnouncementForm({ announcement, onSuccess }: AnnouncementFormProps) {
    const [isPending, startTransition] = useTransition();
    const [type, setType] = useState(announcement?.type || "info");
    const [isActive, setIsActive] = useState(announcement?.is_active ?? true);
    const [dismissible, setDismissible] = useState(announcement?.dismissible ?? true);
    const [message, setMessage] = useState(announcement?.message || "");
    const [linkUrl, setLinkUrl] = useState(announcement?.link_url || "");
    const [linkLabel, setLinkLabel] = useState(announcement?.link_label || "");
    const [emoji, setEmoji] = useState(announcement?.emoji || "");
    const [animation, setAnimation] = useState(announcement?.animation || "none");
    const [position, setPosition] = useState(announcement?.position || "top");
    const [displayFormat, setDisplayFormat] = useState(announcement?.display_format || "bar");

    const formatDateForInput = (dateStr: string | null | undefined) => {
        if (!dateStr) return "";
        try { return new Date(dateStr).toISOString().slice(0, 16); } catch { return ""; }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set("type", type);
        formData.set("is_active", isActive ? "true" : "false");
        formData.set("dismissible", dismissible ? "true" : "false");
        formData.set("emoji", emoji);
        formData.set("animation", animation);
        formData.set("position", position);
        formData.set("display_format", displayFormat);

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

    const solids = Object.entries(announcementColors).filter(([, v]) => v.group === "solid");
    const gradients = Object.entries(announcementColors).filter(([, v]) => v.group === "gradient");

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Miniature Dashboard Preview */}
            {message && (
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Aperçu</Label>
                    <div className="relative border border-border rounded-xl overflow-hidden h-[200px] bg-background">
                        {/* Mini sidebar */}
                        <div className="absolute left-0 top-0 bottom-0 w-10 bg-muted/60 border-r border-border flex flex-col items-center gap-2 py-3">
                            <div className="w-5 h-5 rounded bg-muted-foreground/20" />
                            <div className="w-5 h-1.5 rounded-full bg-muted-foreground/15" />
                            <div className="w-5 h-1.5 rounded-full bg-muted-foreground/15" />
                            <div className="w-5 h-1.5 rounded-full bg-muted-foreground/15" />
                            <div className="w-5 h-1.5 rounded-full bg-muted-foreground/15" />
                        </div>
                        {/* Main content area */}
                        <div className="absolute left-10 top-0 right-0 bottom-0 flex flex-col">
                            {/* Top announcement */}
                            {position === "top" && displayFormat !== "popup" && (
                                <div className={`${getBarStyle(type)} ${getFormatClasses(displayFormat)} ${getAnimationClass(animation, position)} px-2 py-1 text-[8px] font-medium flex items-center justify-center gap-1 shrink-0 overflow-hidden`}>
                                    {emoji && <span className="text-[10px] shrink-0">{emoji}</span>}
                                    <span className="truncate">{message}</span>
                                    {dismissible && <X className="h-2 w-2 shrink-0 opacity-70" />}
                                </div>
                            )}
                            {/* Content placeholder */}
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-[10px] text-muted-foreground/50">Contenu</span>
                            </div>
                            {/* Bottom announcement (in flow) */}
                            {position === "bottom" && displayFormat !== "popup" && (
                                <div className={`${getBarStyle(type)} ${getFormatClasses(displayFormat)} ${getAnimationClass(animation, position)} px-2 py-1 text-[8px] font-medium flex items-center justify-center gap-1 shrink-0 overflow-hidden`}>
                                    {emoji && <span className="text-[10px] shrink-0">{emoji}</span>}
                                    <span className="truncate">{message}</span>
                                    {dismissible && <X className="h-2 w-2 shrink-0 opacity-70" />}
                                </div>
                            )}
                        </div>
                        {/* Floating announcements */}
                        {(position === "floating-br" || position === "floating-bl") && displayFormat !== "popup" && (
                            <div className={`absolute bottom-2 ${position === "floating-br" ? "right-2" : "left-12"} max-w-[60%]`}>
                                <div className={`${getBarStyle(type)} ${displayFormat === "bar" ? "rounded-xl shadow-lg" : getFormatClasses(displayFormat)} ${getAnimationClass(animation, position)} px-2 py-1 text-[8px] font-medium flex items-center justify-center gap-1 overflow-hidden`}>
                                    {emoji && <span className="text-[10px] shrink-0">{emoji}</span>}
                                    <span className="truncate">{message}</span>
                                    {dismissible && <X className="h-2 w-2 shrink-0 opacity-70" />}
                                </div>
                            </div>
                        )}
                        {/* Popup overlay */}
                        {displayFormat === "popup" && (
                            <div className="absolute left-10 top-0 right-0 bottom-0 bg-black/40 flex items-center justify-center p-4">
                                <div className={`${getBarStyle(type)} rounded-2xl shadow-2xl px-3 py-2 text-[8px] font-medium flex items-center justify-center gap-1 max-w-[80%] overflow-hidden`}>
                                    {emoji && <span className="text-[10px] shrink-0">{emoji}</span>}
                                    <span className="truncate">{message}</span>
                                    {dismissible && <X className="h-2 w-2 shrink-0 opacity-70" />}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                    id="message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    required
                    placeholder="Écrivez votre annonce ici..."
                />
            </div>

            {/* Emoji */}
            <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <div className="flex items-center gap-3">
                    <Input
                        id="emoji"
                        name="emoji"
                        value={emoji}
                        onChange={(e) => setEmoji(e.target.value)}
                        placeholder="ex: 🎉"
                        className="w-20 text-center text-lg"
                        maxLength={4}
                    />
                    <div className="flex gap-1.5">
                        {["🎉", "🚀", "⚠️", "🔥", "💡", "📢", "🎁", "✨"].map((e) => (
                            <button
                                key={e}
                                type="button"
                                onClick={() => setEmoji(e)}
                                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${emoji === e ? "bg-orange-500/20 ring-2 ring-orange-500 scale-110" : "hover:bg-muted"}`}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                    {emoji && (
                        <button type="button" onClick={() => setEmoji("")} className="text-xs text-muted-foreground hover:text-foreground">
                            Retirer
                        </button>
                    )}
                </div>
            </div>

            {/* Color / Type */}
            <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {solids.map(([key, cfg]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setType(key)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${type === key
                                    ? "border-foreground/30 bg-muted text-foreground scale-105 shadow-sm"
                                    : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {gradients.map(([key, cfg]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setType(key)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${type === key
                                    ? "border-foreground/30 bg-muted text-foreground scale-105 shadow-sm"
                                    : "border-border text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Animation */}
            <div className="space-y-2">
                <Label>Animation</Label>
                <div className="flex flex-wrap gap-2">
                    {announcementAnimations.map((anim) => (
                        <button
                            key={anim.value}
                            type="button"
                            onClick={() => setAnimation(anim.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${animation === anim.value
                                ? "border-foreground/30 bg-muted text-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                            title={anim.description}
                        >
                            {anim.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
                <Label>Position</Label>
                <div className="flex flex-wrap gap-2">
                    {announcementPositions.map((pos) => (
                        <button
                            key={pos.value}
                            type="button"
                            onClick={() => setPosition(pos.value)}
                            disabled={displayFormat === "popup"}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${position === pos.value && displayFormat !== "popup"
                                ? "border-foreground/30 bg-muted text-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            } ${displayFormat === "popup" ? "opacity-40 cursor-not-allowed" : ""}`}
                            title={pos.description}
                        >
                            {pos.label}
                        </button>
                    ))}
                </div>
                {displayFormat === "popup" && (
                    <p className="text-[11px] text-muted-foreground">Les popups s&apos;affichent toujours au centre</p>
                )}
            </div>

            {/* Format */}
            <div className="space-y-2">
                <Label>Format</Label>
                <div className="flex flex-wrap gap-2">
                    {announcementFormats.map((fmt) => (
                        <button
                            key={fmt.value}
                            type="button"
                            onClick={() => setDisplayFormat(fmt.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${displayFormat === fmt.value
                                ? "border-foreground/30 bg-muted text-foreground"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                            title={fmt.description}
                        >
                            {fmt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Link */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="link_url">URL du lien</Label>
                    <Input
                        id="link_url"
                        name="link_url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://... ou /page"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="link_label">Texte du lien</Label>
                    <Input
                        id="link_label"
                        name="link_label"
                        value={linkLabel}
                        onChange={(e) => setLinkLabel(e.target.value)}
                        placeholder="En savoir plus"
                    />
                </div>
            </div>

            {/* Scheduling */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label htmlFor="starts_at">Date de début</Label>
                    <Input
                        id="starts_at"
                        name="starts_at"
                        type="datetime-local"
                        defaultValue={formatDateForInput(announcement?.starts_at)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="expires_at">Date d&apos;expiration</Label>
                    <Input
                        id="expires_at"
                        name="expires_at"
                        type="datetime-local"
                        defaultValue={formatDateForInput(announcement?.expires_at)}
                    />
                </div>
            </div>

            {/* Priority + Toggles */}
            <div className="flex items-end gap-6">
                <div className="space-y-2">
                    <Label htmlFor="priority">Priorité</Label>
                    <Input
                        id="priority"
                        name="priority"
                        type="number"
                        defaultValue={announcement?.priority ?? 0}
                        className="w-20"
                    />
                </div>

                <div className="flex items-center gap-3 pb-1">
                    <Label>Active</Label>
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

                <div className="flex items-center gap-3 pb-1">
                    <Label>Fermable</Label>
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
