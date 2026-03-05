"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { updateComplaintStatusAction } from "@/actions/admin/complaints";
import { toast } from "sonner";
import {
    Loader2,
    Image as ImageIcon,
    Headphones,
    ArrowRight,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";

interface Complaint {
    id: string;
    subject: string;
    description: string;
    photo_url: string | null;
    audio_url: string | null;
    status: ComplaintStatus;
    admin_notes: string | null;
    created_at: string;
    organizations: { id: string; name: string } | null;
    profiles: { full_name: string | null } | null;
}

const STATUS_META: Record<ComplaintStatus, { label: string; color: string }> = {
    open: { label: "Ouvert", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
    in_progress: { label: "En cours", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
    resolved: { label: "Résolu", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" },
    closed: { label: "Fermé", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

interface ComplaintsClientProps {
    complaints: Complaint[];
}

export function ComplaintsClient({ complaints: initial }: ComplaintsClientProps) {
    const [complaints, setComplaints] = useState(initial);
    const [filter, setFilter] = useState<"all" | ComplaintStatus>("all");
    const [selected, setSelected] = useState<Complaint | null>(null);
    const [actionType, setActionType] = useState<"in_progress" | "resolved" | "closed" | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const filtered = filter === "all"
        ? complaints
        : complaints.filter((c) => c.status === filter);

    const handleAction = async () => {
        if (!selected || !actionType) return;
        setLoading(true);

        const result = await updateComplaintStatusAction(
            selected.id,
            actionType,
            adminNotes,
        );

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Statut mis à jour.");
            setComplaints((prev) =>
                prev.map((c) =>
                    c.id === selected.id
                        ? { ...c, status: actionType, admin_notes: adminNotes || c.admin_notes }
                        : c
                )
            );
            setSelected(null);
            setActionType(null);
            setAdminNotes("");
        }
        setLoading(false);
    };

    const openAction = (complaint: Complaint, action: "in_progress" | "resolved" | "closed") => {
        setSelected(complaint);
        setActionType(action);
        setAdminNotes(complaint.admin_notes || "");
    };

    const filters: ("all" | ComplaintStatus)[] = ["all", "open", "in_progress", "resolved", "closed"];

    const actionLabel: Record<string, string> = {
        in_progress: "Prendre en charge",
        resolved: "Marquer comme résolu",
        closed: "Fermer",
    };

    return (
        <>
            {/* Filters */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {filters.map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(f)}
                    >
                        {f === "all" ? "Tous" : STATUS_META[f].label}
                        {f !== "all" && (
                            <span className="ml-1 text-xs opacity-60">
                                ({complaints.filter((c) => c.status === f).length})
                            </span>
                        )}
                    </Button>
                ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-sm">Aucun signalement.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-muted-foreground">
                                <th className="pb-2 pr-3 font-medium">Organisation</th>
                                <th className="pb-2 pr-3 font-medium">Objet</th>
                                <th className="pb-2 pr-3 font-medium hidden md:table-cell">Description</th>
                                <th className="pb-2 pr-3 font-medium text-center">Media</th>
                                <th className="pb-2 pr-3 font-medium">Statut</th>
                                <th className="pb-2 pr-3 font-medium hidden sm:table-cell">Date</th>
                                <th className="pb-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-3 pr-3">
                                        <span className="font-medium text-xs">
                                            {c.organizations?.name || "—"}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <span className="font-medium line-clamp-1">{c.subject}</span>
                                        <span className="text-xs text-muted-foreground block">
                                            {c.profiles?.full_name || "—"}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3 hidden md:table-cell">
                                        <span className="text-muted-foreground line-clamp-2 text-xs">
                                            {c.description}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {c.photo_url && <ImageIcon className="h-3.5 w-3.5 text-blue-500" />}
                                            {c.audio_url && <Headphones className="h-3.5 w-3.5 text-purple-500" />}
                                            {!c.photo_url && !c.audio_url && <span className="text-muted-foreground">—</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 pr-3">
                                        <Badge variant="secondary" className={cn("text-[10px]", STATUS_META[c.status].color)}>
                                            {STATUS_META[c.status].label}
                                        </Badge>
                                    </td>
                                    <td className="py-3 pr-3 hidden sm:table-cell text-xs text-muted-foreground">
                                        {new Date(c.created_at).toLocaleDateString("fr-FR", {
                                            day: "numeric", month: "short",
                                        })}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-1">
                                            {c.status === "open" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => openAction(c, "in_progress")}
                                                >
                                                    <ArrowRight className="h-3 w-3 mr-0.5" />
                                                    Prendre en charge
                                                </Button>
                                            )}
                                            {c.status === "in_progress" && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs text-green-600"
                                                        onClick={() => openAction(c, "resolved")}
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                                        Résoudre
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => openAction(c, "closed")}
                                                    >
                                                        <XCircle className="h-3 w-3 mr-0.5" />
                                                        Fermer
                                                    </Button>
                                                </>
                                            )}
                                            {(c.status === "resolved" || c.status === "closed") && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => {
                                                        setSelected(c);
                                                        setActionType(null);
                                                    }}
                                                >
                                                    Voir
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Action / Detail Dialog */}
            <Dialog
                open={!!selected}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelected(null);
                        setActionType(null);
                        setAdminNotes("");
                    }
                }}
            >
                <DialogContent className="max-w-[95vw] sm:max-w-lg">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.subject}</DialogTitle>
                                <DialogDescription>
                                    {selected.organizations?.name} — {new Date(selected.created_at).toLocaleDateString("fr-FR", {
                                        day: "numeric", month: "long", year: "numeric",
                                    })}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <Badge variant="secondary" className={STATUS_META[selected.status].color}>
                                    {STATUS_META[selected.status].label}
                                </Badge>

                                <p className="text-sm whitespace-pre-wrap">{selected.description}</p>

                                {selected.photo_url && (
                                    <div className="rounded-lg overflow-hidden border border-border">
                                        <img
                                            src={selected.photo_url}
                                            alt="Photo"
                                            className="w-full max-h-64 object-contain bg-muted"
                                        />
                                    </div>
                                )}

                                {selected.audio_url && (
                                    <audio src={selected.audio_url} controls className="w-full" />
                                )}

                                {actionType && (
                                    <div className="space-y-2 border-t border-border pt-3">
                                        <Label>Notes admin</Label>
                                        <Textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Notes ou réponse pour le client..."
                                            rows={3}
                                        />
                                    </div>
                                )}

                                {!actionType && selected.admin_notes && (
                                    <div className="border-t border-border pt-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes admin</p>
                                        <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                                            {selected.admin_notes}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {actionType && (
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => { setSelected(null); setActionType(null); }} disabled={loading}>
                                        Annuler
                                    </Button>
                                    <Button onClick={handleAction} disabled={loading}>
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : null}
                                        {actionLabel[actionType]}
                                    </Button>
                                </DialogFooter>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
