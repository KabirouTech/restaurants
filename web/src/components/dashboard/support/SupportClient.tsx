"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { CreateComplaintDialog } from "./CreateComplaintDialog";
import { useTranslations } from "next-intl";
import {
    Plus,
    Image as ImageIcon,
    Headphones,
    MessageSquareWarning,
} from "lucide-react";

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
}

interface SupportClientProps {
    complaints: Complaint[];
}

const STATUS_COLORS: Record<ComplaintStatus, string> = {
    open: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    resolved: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function SupportClient({ complaints }: SupportClientProps) {
    const t = useTranslations("dashboard.support");
    const [createOpen, setCreateOpen] = useState(false);
    const [filter, setFilter] = useState<"all" | ComplaintStatus>("all");
    const [selected, setSelected] = useState<Complaint | null>(null);

    const statusLabel = (s: ComplaintStatus) => {
        const map: Record<ComplaintStatus, string> = {
            open: t("statusOpen"),
            in_progress: t("statusInProgress"),
            resolved: t("statusResolved"),
            closed: t("statusClosed"),
        };
        return map[s];
    };

    const filtered = filter === "all"
        ? complaints
        : complaints.filter((c) => c.status === filter);

    const filters: ("all" | ComplaintStatus)[] = ["all", "open", "in_progress", "resolved", "closed"];

    return (
        <>
            {/* Filters + Create */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap gap-1.5">
                    {filters.map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(f)}
                        >
                            {f === "all" ? t("all") : statusLabel(f as ComplaintStatus)}
                        </Button>
                    ))}
                </div>
                <Button onClick={() => setCreateOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("reportProblem")}
                </Button>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <MessageSquareWarning className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{t("noComplaints")}</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((c) => (
                        <div
                            key={c.id}
                            className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors"
                            onClick={() => setSelected(c)}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-medium text-sm line-clamp-1">{c.subject}</h3>
                                <Badge variant="secondary" className={STATUS_COLORS[c.status]}>
                                    {statusLabel(c.status)}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {c.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>
                                    {t("sentOn")} {new Date(c.created_at).toLocaleDateString("fr-FR", {
                                        day: "numeric", month: "short", year: "numeric"
                                    })}
                                </span>
                                {c.photo_url && (
                                    <span className="flex items-center gap-0.5">
                                        <ImageIcon className="h-3 w-3" /> {t("photoAttached")}
                                    </span>
                                )}
                                {c.audio_url && (
                                    <span className="flex items-center gap-0.5">
                                        <Headphones className="h-3 w-3" /> {t("audioAttached")}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.subject}</DialogTitle>
                                <DialogDescription>
                                    {t("sentOn")} {new Date(selected.created_at).toLocaleDateString("fr-FR", {
                                        day: "numeric", month: "long", year: "numeric"
                                    })}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <Badge variant="secondary" className={STATUS_COLORS[selected.status]}>
                                    {statusLabel(selected.status)}
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

                                <div className="border-t border-border pt-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                        {t("adminResponse")}
                                    </p>
                                    {selected.admin_notes ? (
                                        <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">
                                            {selected.admin_notes}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            {t("noResponse")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <CreateComplaintDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
            />
        </>
    );
}
