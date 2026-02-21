"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { AnnouncementDialog } from "@/components/admin/AnnouncementDialog";
import { deleteAnnouncementAction, updateAnnouncementAction } from "@/actions/admin/announcements";
import { toast } from "sonner";
import { Megaphone, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Announcement {
    id: string;
    message: string;
    type: string;
    is_active: boolean;
    dismissible: boolean;
    created_at: string;
}

const typeStyles: Record<string, { bg: string; text: string; label: string }> = {
    info: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Info" },
    warning: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Attention" },
    success: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Succès" },
};

export function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editAnnouncement, setEditAnnouncement] = useState<Announcement | undefined>();
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const handleEdit = (announcement: Announcement) => {
        setEditAnnouncement(announcement);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditAnnouncement(undefined);
        setDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Supprimer cette annonce ?")) return;
        setDeletingId(id);
        startTransition(async () => {
            const result = await deleteAnnouncementAction(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Annonce supprimée");
            }
            setDeletingId(null);
        });
    };

    const handleToggleActive = (announcement: Announcement) => {
        setTogglingId(announcement.id);
        const formData = new FormData();
        formData.set("message", announcement.message);
        formData.set("type", announcement.type);
        formData.set("is_active", announcement.is_active ? "false" : "true");
        formData.set("dismissible", announcement.dismissible ? "true" : "false");

        startTransition(async () => {
            const result = await updateAnnouncementAction(announcement.id, formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(announcement.is_active ? "Annonce désactivée" : "Annonce activée");
            }
            setTogglingId(null);
        });
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Megaphone className="h-7 w-7 text-orange-500" />
                        Annonces
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">{announcements.length} annonce{announcements.length > 1 ? "s" : ""}</p>
                </div>
                <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle annonce
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {announcements.length > 0 ? (
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="divide-y divide-border">
                            {announcements.map((ann) => {
                                const style = typeStyles[ann.type] || typeStyles.info;
                                return (
                                    <div key={ann.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                                        {/* Type badge */}
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text} shrink-0`}>
                                            {style.label}
                                        </span>

                                        {/* Message */}
                                        <p className="flex-1 text-sm text-foreground line-clamp-2">{ann.message}</p>

                                        {/* Dismissible */}
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {ann.dismissible ? "Fermable" : "Persistante"}
                                        </span>

                                        {/* Active toggle */}
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={ann.is_active}
                                            onClick={() => handleToggleActive(ann)}
                                            disabled={togglingId === ann.id}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${ann.is_active ? "bg-green-500" : "bg-muted"} ${togglingId === ann.id ? "opacity-50" : ""}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ann.is_active ? "translate-x-6" : "translate-x-1"}`} />
                                        </button>

                                        {/* Actions */}
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ann)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                onClick={() => handleDelete(ann.id)}
                                                disabled={deletingId === ann.id}
                                            >
                                                {deletingId === ann.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Megaphone className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">Aucune annonce</p>
                        <p className="text-sm mb-6">Créez votre première annonce plateforme</p>
                        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Créer une annonce
                        </Button>
                    </div>
                )}
            </div>

            <AnnouncementDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                announcement={editAnnouncement}
            />
        </div>
    );
}
