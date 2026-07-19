"use client";

import { useMemo, useState, useTransition } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { giftPremiumAction } from "@/actions/admin/organizations";

const PRESET_DAYS = [3, 7, 14, 30, 60, 90];

type Mode = "days" | "until";

interface GiftPremiumDialogProps {
    orgId: string;
    orgName?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Appelé après un cadeau réussi, avec la date d'expiration ISO. */
    onGifted?: (expiresAt: string) => void;
}

/**
 * Offrir le Premium pour une période libre : durée en jours (presets ou saisie
 * libre) ou date de fin explicite. L'expiration est ensuite appliquée
 * automatiquement côté base (job pg_cron).
 */
export function GiftPremiumDialog({
    orgId,
    orgName,
    open,
    onOpenChange,
    onGifted,
}: GiftPremiumDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [mode, setMode] = useState<Mode>("days");
    const [days, setDays] = useState("7");
    const [endDate, setEndDate] = useState("");
    // Horloge capturée au montage (Date.now() est interdit pendant le rendu) —
    // suffisant pour l'aperçu ; la validation stricte est refaite côté serveur.
    const [nowMs] = useState<number>(() => Date.now());

    const tomorrow = new Date(nowMs + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    const parsedDays = parseInt(days, 10);
    const expiresPreview = useMemo(() => {
        if (mode === "days") {
            if (!Number.isInteger(parsedDays) || parsedDays < 1) return null;
            return new Date(nowMs + parsedDays * 24 * 60 * 60 * 1000);
        }
        if (!endDate) return null;
        const d = new Date(`${endDate}T23:59:59.999Z`);
        return Number.isNaN(d.getTime()) ? null : d;
    }, [mode, parsedDays, endDate, nowMs]);

    const canSubmit =
        expiresPreview !== null && expiresPreview.getTime() > nowMs;

    const handleGift = () => {
        startTransition(async () => {
            const result = await giftPremiumAction(
                orgId,
                mode === "days" ? { days: parsedDays } : { endsAt: endDate }
            );
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(
                `Premium offert jusqu'au ${new Date(result.expiresAt!).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                })}`
            );
            onOpenChange(false);
            onGifted?.(result.expiresAt!);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-amber-500" />
                        Offrir le Premium
                        {orgName ? <span className="font-normal text-muted-foreground">— {orgName}</span> : null}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    {/* Mode */}
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                        {([
                            { key: "days", label: "Durée" },
                            { key: "until", label: "Jusqu'à une date" },
                        ] as const).map((m) => (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => setMode(m.key)}
                                className={cn(
                                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                                    mode === m.key
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {mode === "days" ? (
                        <div className="space-y-2">
                            <Label>Durée (jours)</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_DAYS.map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDays(String(d))}
                                        className={cn(
                                            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                                            days === String(d)
                                                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                : "border-border text-muted-foreground hover:border-amber-300"
                                        )}
                                    >
                                        {d} j
                                    </button>
                                ))}
                            </div>
                            <Input
                                type="number"
                                min={1}
                                max={730}
                                value={days}
                                onChange={(e) => setDays(e.target.value)}
                                placeholder="Nombre de jours"
                                className="h-9"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Date de fin (incluse)</Label>
                            <Input
                                type="date"
                                min={tomorrow}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-9"
                            />
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        {expiresPreview && canSubmit ? (
                            <>
                                Premium actif jusqu&apos;au{" "}
                                <span className="font-medium text-foreground">
                                    {expiresPreview.toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                                , puis retour automatique au plan Gratuit. Révocable à tout moment.
                            </>
                        ) : (
                            "Choisissez une durée ou une date de fin."
                        )}
                    </p>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button
                            className="flex-1 bg-amber-500 hover:bg-amber-600"
                            onClick={handleGift}
                            disabled={isPending || !canSubmit}
                        >
                            {isPending && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                            Offrir
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
