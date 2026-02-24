"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AnnouncementDialog } from "@/components/admin/AnnouncementDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    deleteAnnouncementAction,
    duplicateAnnouncementAction,
    bulkDeleteAnnouncementsAction,
    bulkToggleAnnouncementsAction,
} from "@/actions/admin/announcements";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Megaphone, Plus, Pencil, Trash2, Loader2,
    Copy, Search, Power, PowerOff, Clock, CalendarX2, ExternalLink, Sparkles,
} from "lucide-react";
import { announcementColors, announcementAnimations, announcementPositions, announcementFormats, getAnimationClass, getBarStyle } from "@/lib/announcement-styles";

interface Announcement {
    id: string;
    message: string;
    type: string;
    is_active: boolean;
    dismissible: boolean;
    link_url: string | null;
    link_label: string | null;
    starts_at: string | null;
    expires_at: string | null;
    priority: number;
    emoji: string | null;
    animation: string | null;
    position: string | null;
    display_format: string | null;
    created_at: string;
    updated_at: string;
}

type StatusFilter = "all" | "active" | "inactive" | "scheduled" | "expired";

function getAnnouncementStatus(ann: Announcement): "active" | "inactive" | "scheduled" | "expired" {
    if (!ann.is_active) return "inactive";
    const now = new Date();
    if (ann.starts_at && new Date(ann.starts_at) > now) return "scheduled";
    if (ann.expires_at && new Date(ann.expires_at) < now) return "expired";
    return "active";
}

const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-500 text-white" },
    inactive: { label: "Inactive", className: "bg-gray-400 text-white" },
    scheduled: { label: "Programmée", className: "bg-blue-500 text-white" },
    expired: { label: "Expirée", className: "bg-red-500 text-white" },
};

export function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editAnnouncement, setEditAnnouncement] = useState<Announcement | undefined>();
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<"delete" | "activate" | "deactivate">("delete");
    const [bulkPending, setBulkPending] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const filtered = useMemo(() => {
        return announcements.filter((ann) => {
            if (search && !ann.message.toLowerCase().includes(search.toLowerCase())) return false;
            if (typeFilter !== "all" && ann.type !== typeFilter) return false;
            if (statusFilter !== "all" && getAnnouncementStatus(ann) !== statusFilter) return false;
            return true;
        });
    }, [announcements, search, typeFilter, statusFilter]);

    const allSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id));

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(filtered.map(a => a.id)));
    };

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
            if (result.error) toast.error(result.error);
            else toast.success("Annonce supprimée");
            setDeletingId(null);
        });
    };

    const handleDuplicate = (id: string) => {
        setDuplicatingId(id);
        startTransition(async () => {
            const result = await duplicateAnnouncementAction(id);
            if (result.error) toast.error(result.error);
            else toast.success("Annonce dupliquée (inactive)");
            setDuplicatingId(null);
        });
    };

    const handleToggleActive = (ann: Announcement) => {
        setTogglingId(ann.id);
        startTransition(async () => {
            const result = await bulkToggleAnnouncementsAction([ann.id], !ann.is_active);
            if (result.error) toast.error(result.error);
            else toast.success(ann.is_active ? "Annonce désactivée" : "Annonce activée");
            setTogglingId(null);
        });
    };

    const handleBulkAction = (action: "delete" | "activate" | "deactivate") => {
        setBulkAction(action);
        setBulkConfirmOpen(true);
    };

    const handleBulkConfirm = () => {
        setBulkPending(true);
        startTransition(async () => {
            const ids = Array.from(selected);
            let result;
            if (bulkAction === "delete") {
                result = await bulkDeleteAnnouncementsAction(ids);
            } else {
                result = await bulkToggleAnnouncementsAction(ids, bulkAction === "activate");
            }
            if (result.error) {
                toast.error(result.error);
            } else {
                const n = selected.size;
                if (bulkAction === "delete") toast.success(`${n} annonce${n > 1 ? "s" : ""} supprimée${n > 1 ? "s" : ""}`);
                else if (bulkAction === "activate") toast.success(`${n} annonce${n > 1 ? "s" : ""} activée${n > 1 ? "s" : ""}`);
                else toast.success(`${n} annonce${n > 1 ? "s" : ""} désactivée${n > 1 ? "s" : ""}`);
                setSelected(new Set());
            }
            setBulkPending(false);
            setBulkConfirmOpen(false);
        });
    };

    // Counts for filter badges
    const counts = useMemo(() => {
        const c = { all: announcements.length, active: 0, inactive: 0, scheduled: 0, expired: 0 };
        announcements.forEach(a => { c[getAnnouncementStatus(a)]++; });
        return c;
    }, [announcements]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Megaphone className="h-7 w-7 text-orange-500" />
                        Annonces
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">
                        {filtered.length} annonce{filtered.length > 1 ? "s" : ""}
                        {filtered.length !== announcements.length && ` sur ${announcements.length}`}
                    </p>
                </div>
                <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle annonce
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher dans les annonces..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="all">Toutes les couleurs</option>
                        {Object.entries(announcementColors).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="all">Tous les statuts ({counts.all})</option>
                        <option value="active">Actives ({counts.active})</option>
                        <option value="inactive">Inactives ({counts.inactive})</option>
                        <option value="scheduled">Programmées ({counts.scheduled})</option>
                        <option value="expired">Expirées ({counts.expired})</option>
                    </select>
                </div>

                {/* Bulk action bar */}
                {selected.size > 0 && (
                    <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
                        </span>
                        <div className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="text-muted-foreground">
                            Désélectionner
                        </Button>
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleBulkAction("activate")} disabled={bulkPending}>
                            <Power className="h-3.5 w-3.5 mr-1" /> Activer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")} disabled={bulkPending}>
                            <PowerOff className="h-3.5 w-3.5 mr-1" /> Désactiver
                        </Button>
                        <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleBulkAction("delete")} disabled={bulkPending}>
                            {bulkPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                            Supprimer ({selected.size})
                        </Button>
                    </div>
                )}

                {filtered.length > 0 ? (
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        {/* Select all header */}
                        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleAll}
                                className="h-4 w-4 rounded border-border accent-orange-500 shrink-0"
                            />
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tout sélectionner</span>
                        </div>

                        <div className="divide-y divide-border">
                            {filtered.map((ann) => {
                                const colorCfg = announcementColors[ann.type] || announcementColors.info;
                                const status = getAnnouncementStatus(ann);
                                const sc = statusConfig[status];
                                const animLabel = announcementAnimations.find(a => a.value === ann.animation)?.label;

                                return (
                                    <div key={ann.id} className={`p-4 hover:bg-muted/30 transition-colors ${selected.has(ann.id) ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                                        {/* Mini preview bar */}
                                        <div className={`${getBarStyle(ann.type)} ${getAnimationClass(ann.animation)} h-1.5 -mt-4 -mx-4 mb-3 rounded-t-xl overflow-hidden`} />

                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={selected.has(ann.id)}
                                                onChange={() => toggleSelect(ann.id)}
                                                className="h-4 w-4 rounded border-border accent-orange-500 shrink-0 mt-1"
                                            />

                                            {/* Emoji or color dot */}
                                            <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                                                {ann.emoji ? (
                                                    <span className="text-lg leading-none">{ann.emoji}</span>
                                                ) : (
                                                    <span className={`w-3 h-3 rounded-full ${colorCfg.dot}`} title={colorCfg.label} />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.className}`}>
                                                        {sc.label}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorCfg.badge} ${colorCfg.badgeText}`}>
                                                        {colorCfg.label}
                                                    </span>
                                                    {ann.animation && ann.animation !== "none" && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center gap-0.5">
                                                            <Sparkles className="h-2.5 w-2.5" />
                                                            {animLabel}
                                                        </span>
                                                    )}
                                                    {ann.position && ann.position !== "top" && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                                                            {announcementPositions.find(p => p.value === ann.position)?.label || ann.position}
                                                        </span>
                                                    )}
                                                    {ann.display_format && ann.display_format !== "bar" && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                                            {announcementFormats.find(f => f.value === ann.display_format)?.label || ann.display_format}
                                                        </span>
                                                    )}
                                                    {!ann.dismissible && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                                                            Persistante
                                                        </span>
                                                    )}
                                                    {ann.priority > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                                            Priorité {ann.priority}
                                                        </span>
                                                    )}
                                                    {ann.link_url && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                            {ann.link_label || ann.link_url}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-sm text-foreground leading-relaxed">{ann.message}</p>

                                                {/* Dates */}
                                                <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                                                    {ann.starts_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Début : {format(new Date(ann.starts_at), "d MMM yyyy HH:mm", { locale: fr })}
                                                        </span>
                                                    )}
                                                    {ann.expires_at && (
                                                        <span className="flex items-center gap-1">
                                                            <CalendarX2 className="h-3 w-3" />
                                                            Expire : {format(new Date(ann.expires_at), "d MMM yyyy HH:mm", { locale: fr })}
                                                        </span>
                                                    )}
                                                    <span>
                                                        Créée : {format(new Date(ann.created_at), "d MMM yyyy", { locale: fr })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Toggle + Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={ann.is_active}
                                                    onClick={() => handleToggleActive(ann)}
                                                    disabled={togglingId === ann.id}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ann.is_active ? "bg-green-500" : "bg-muted"} ${togglingId === ann.id ? "opacity-50" : ""}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ann.is_active ? "translate-x-6" : "translate-x-1"}`} />
                                                </button>

                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ann)} title="Modifier">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDuplicate(ann.id)}
                                                    disabled={duplicatingId === ann.id}
                                                    title="Dupliquer"
                                                >
                                                    {duplicatingId === ann.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    onClick={() => handleDelete(ann.id)}
                                                    disabled={deletingId === ann.id}
                                                    title="Supprimer"
                                                >
                                                    {deletingId === ann.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : announcements.length > 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Search className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">Aucun résultat</p>
                        <p className="text-sm mb-6">Essayez de modifier vos filtres</p>
                        <Button variant="outline" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}>
                            Réinitialiser les filtres
                        </Button>
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

            <ConfirmDialog
                open={bulkConfirmOpen}
                onOpenChange={setBulkConfirmOpen}
                title={
                    bulkAction === "delete"
                        ? `Supprimer ${selected.size} annonce${selected.size > 1 ? "s" : ""} ?`
                        : bulkAction === "activate"
                            ? `Activer ${selected.size} annonce${selected.size > 1 ? "s" : ""} ?`
                            : `Désactiver ${selected.size} annonce${selected.size > 1 ? "s" : ""} ?`
                }
                description={
                    bulkAction === "delete"
                        ? "Cette action est irréversible."
                        : bulkAction === "activate"
                            ? "Les annonces sélectionnées seront visibles sur le dashboard."
                            : "Les annonces sélectionnées ne seront plus visibles."
                }
                confirmLabel={
                    bulkAction === "delete"
                        ? `Supprimer (${selected.size})`
                        : bulkAction === "activate"
                            ? `Activer (${selected.size})`
                            : `Désactiver (${selected.size})`
                }
                variant={bulkAction === "delete" || bulkAction === "deactivate" ? "destructive" : "default"}
                onConfirm={handleBulkConfirm}
            />
        </div>
    );
}
