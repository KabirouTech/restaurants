"use client";

import { useState } from "react";
import { Check, CheckCircle2, Lock, Loader2, MessageSquare, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createUpgradeRequest } from "@/lib/plans/upgrade-pipeline";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

// ─── Feature metadata ────────────────────────────────────────────────────────

export type GatedFeature = "unified_inbox" | "advanced_reports" | "ai_replies" | "api_access";

const FEATURE_META: Record<GatedFeature, {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    highlights: string[];
    color: string;
    bgColor: string;
    plan: "premium" | "enterprise";
}> = {
    unified_inbox: {
        title: "Messagerie Unifiée",
        subtitle: "Tous vos clients, un seul endroit.",
        description: "Répondez aux messages WhatsApp, Instagram, Email et Messenger depuis une seule boîte de réception. Ne ratez plus jamais une commande.",
        icon: <MessageSquare className="h-8 w-8" />,
        highlights: [
            "WhatsApp, Instagram, Email & Messenger",
            "Notifications en temps réel",
            "Historique complet par client",
            "Assignation à un membre de l'équipe",
        ],
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950/30",
        plan: "premium",
    },
    advanced_reports: {
        title: "Rapports Avancés",
        subtitle: "Prenez des décisions basées sur les données.",
        description: "Visualisez vos revenus, vos événements les plus rentables et les tendances de votre activité.",
        icon: <Zap className="h-8 w-8" />,
        highlights: [
            "Revenus par mois et par événement",
            "Taux d'acceptation des devis",
            "Clients les plus fidèles",
            "Export PDF & Excel",
        ],
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        plan: "premium",
    },
    ai_replies: {
        title: "Réponses IA",
        subtitle: "Répondez plus vite grâce à l'intelligence artificielle.",
        description: "L'IA génère des réponses adaptées à votre style et à votre menu pour chaque demande client.",
        icon: <Sparkles className="h-8 w-8" />,
        highlights: [
            "Suggestions de réponses contextuelles",
            "Formatage automatique des devis",
            "Détection de la langue du client",
            "Apprentissage de votre style",
        ],
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        plan: "enterprise",
    },
    api_access: {
        title: "Accès API",
        subtitle: "Connectez RestaurantsOS à vos outils.",
        description: "Intégrez RestaurantsOS à votre site web, votre application ou vos outils métier via l'API REST.",
        icon: <Zap className="h-8 w-8" />,
        highlights: [
            "100 000 requêtes API/mois",
            "Webhooks en temps réel",
            "SDK JavaScript & Python",
            "Documentation complète",
        ],
        color: "text-teal-600",
        bgColor: "bg-teal-50 dark:bg-teal-950/30",
        plan: "enterprise",
    },
};

// ─── PlanGate ─────────────────────────────────────────────────────────────────

interface PlanGateProps {
    feature: GatedFeature;
}

export function PlanGate({ feature }: PlanGateProps) {
    const [showUpgrade, setShowUpgrade] = useState(false);
    const meta = FEATURE_META[feature];

    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 relative overflow-hidden animate-in fade-in duration-500">
            {/* Background decoration */}
            <div className={cn("absolute inset-0 opacity-30 -z-10", meta.bgColor)} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            {/* Lock badge */}
            <div className="mb-6 relative">
                <div className={cn(
                    "h-20 w-20 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white dark:border-zinc-800",
                    meta.bgColor, meta.color
                )}>
                    {meta.icon}
                </div>
                <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                    <Lock className="h-3.5 w-3.5 text-white" />
                </div>
            </div>

            {/* Content */}
            <div className="text-center max-w-md space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wide border border-amber-200 dark:border-amber-800">
                    <Sparkles className="h-3 w-3" />
                    Fonctionnalité {meta.plan === "premium" ? "Premium" : "Enterprise"}
                </div>

                <h2 className="text-3xl font-bold font-serif text-foreground">{meta.title}</h2>
                <p className="text-muted-foreground text-base leading-relaxed">{meta.description}</p>

                <ul className="text-left space-y-2 mt-6 bg-card border border-border rounded-xl p-4">
                    {meta.highlights.map(h => (
                        <li key={h} className="flex items-center gap-3 text-sm text-foreground">
                            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            {h}
                        </li>
                    ))}
                </ul>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        size="lg"
                        className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 font-semibold px-8"
                        onClick={() => setShowUpgrade(true)}
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Passer au {meta.plan === "premium" ? "Premium" : "Enterprise"}
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    {meta.plan === "premium"
                        ? "Notre équipe vous contactera pour finaliser votre inscription."
                        : "Sur devis · Contactez-nous pour un tarif personnalisé"}
                </p>
            </div>

            {/* Upgrade dialog */}
            <UpgradeDialog
                open={showUpgrade}
                onClose={() => setShowUpgrade(false)}
                feature={feature}
            />
        </div>
    );
}

// ─── UpgradeDialog ────────────────────────────────────────────────────────────

function UpgradeDialog({ open, onClose, feature }: { open: boolean; onClose: () => void; feature: GatedFeature }) {
    const { organization } = useOrganization();
    const meta = FEATURE_META[feature];
    const [step, setStep] = useState<"form" | "done">("form");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!organization?.id) return;
        setLoading(true);
        try {
            const result = await createUpgradeRequest({
                orgId: organization.id,
                targetPlan: meta.plan,
                notes: notes || undefined,
            });
            if (result.success) {
                setStep("done");
            } else {
                toast.error(result.error || "Erreur lors de la demande.");
            }
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setStep("form");
        setNotes("");
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                {step === "done" ? (
                    <div className="py-8 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold font-serif">Demande envoyée !</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Notre équipe vous contactera sous 24h par WhatsApp ou email pour finaliser votre passage au {meta.plan === "premium" ? "Premium" : "Enterprise"}.
                        </p>
                        <Button onClick={handleClose} className="rounded-full mt-2">Fermer</Button>
                    </div>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="font-serif">
                                Passer au {meta.plan === "premium" ? "Premium" : "Enterprise"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 pt-2">
                            {/* Plan highlights */}
                            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
                                <p className="font-bold text-foreground capitalize">{meta.plan}</p>
                                <p className="text-sm text-muted-foreground">Accès complet à toutes les fonctionnalités</p>
                                <ul className="text-sm text-foreground space-y-1.5 pt-1">
                                    {meta.highlights.map(h => (
                                        <li key={h} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <Label htmlFor="upgrade-notes">Message (optionnel)</Label>
                                <Textarea
                                    id="upgrade-notes"
                                    placeholder="Question, besoin particulier, nombre de membres..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-11 font-semibold"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {loading ? "Envoi..." : "S'inscrire au " + (meta.plan === "premium" ? "Premium" : "Enterprise")}
                            </Button>

                            <p className="text-center text-xs text-muted-foreground">
                                Notre équipe vous contactera sous 24h pour finaliser votre inscription.
                            </p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
