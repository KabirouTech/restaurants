"use client";

import { useState } from "react";
import { ArrowRight, Check, Lock, MessageSquare, Sparkles, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createUpgradeRequest, PLAN_PRICES, MOBILE_MONEY_NUMBERS, MOBILE_MONEY_QR_CODES } from "@/lib/plans/upgrade-pipeline";
import type { PaymentMethod } from "@/lib/plans/upgrade-pipeline";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import Image from "next/image";

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
                        ? "15 000 FCFA/mois · Annulation à tout moment"
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

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string; color: string }[] = [
    { key: "wave", label: "Wave", icon: "🌊", color: "bg-blue-50 border-blue-200 hover:border-blue-400 dark:bg-blue-950/30 dark:border-blue-800" },
    { key: "orange_money", label: "Orange Money", icon: "🟠", color: "bg-orange-50 border-orange-200 hover:border-orange-400 dark:bg-orange-950/30 dark:border-orange-800" },
    { key: "cinetpay", label: "CinetPay", icon: "💳", color: "bg-slate-50 border-slate-200 hover:border-slate-400 dark:bg-slate-950/30 dark:border-slate-800" },
    { key: "bank_transfer", label: "Virement", icon: "🏦", color: "bg-slate-50 border-slate-200 hover:border-slate-400 dark:bg-slate-950/30 dark:border-slate-800" },
];

function UpgradeDialog({ open, onClose, feature }: { open: boolean; onClose: () => void; feature: GatedFeature }) {
    const { organization } = useOrganization();
    const meta = FEATURE_META[feature];
    const [step, setStep] = useState<"choose" | "confirm" | "done">("choose");
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);

    const price = meta.plan === "premium" ? PLAN_PRICES.premium : PLAN_PRICES.enterprise;
    const momoNumber = selectedMethod ? MOBILE_MONEY_NUMBERS[selectedMethod] : null;
    const qrCode = selectedMethod ? MOBILE_MONEY_QR_CODES[selectedMethod] : null;

    async function handleSubmit() {
        if (!organization?.id || !selectedMethod) return;
        setLoading(true);
        try {
            const result = await createUpgradeRequest({
                orgId: organization.id,
                targetPlan: meta.plan,
                paymentMethod: selectedMethod,
                paymentReference: reference || undefined,
                amountFcfa: price.fcfa || undefined,
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
        setStep("choose");
        setSelectedMethod(null);
        setReference("");
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                {step === "done" ? (
                    <div className="py-8 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
                            <Check className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold font-serif">Demande envoyée !</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Notre équipe va traiter votre demande sous 24h. Vous recevrez une confirmation par WhatsApp ou email.
                        </p>
                        <Button onClick={handleClose} className="rounded-full mt-2">Fermer</Button>
                    </div>
                ) : step === "confirm" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="font-serif">Confirmer votre paiement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 pt-2">
                            {/* Instructions */}
                            <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3">
                                <p className="text-sm font-semibold text-foreground">
                                    {selectedMethod === "wave" || selectedMethod === "orange_money"
                                        ? `Envoyez ${price.fcfa.toLocaleString()} FCFA au numéro :`
                                        : "Effectuez votre virement et notez la référence :"}
                                </p>
                                {momoNumber && (
                                    <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
                                        <span className="font-bold text-xl text-foreground tracking-wide">{momoNumber}</span>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(momoNumber); toast.success("Numéro copié !"); }}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Copier
                                        </button>
                                    </div>
                                )}
                                {qrCode && (
                                    <div className="flex justify-center pt-1">
                                        <Image src={qrCode} alt="QR Code" width={120} height={120} className="rounded-lg border border-border" />
                                    </div>
                                )}
                            </div>

                            {/* Reference input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Référence de transaction <span className="text-muted-foreground font-normal">(optionnel)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: WVE-2025-123456"
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Ajoutez la référence pour accélérer le traitement de votre demande.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setStep("choose")} className="flex-1 rounded-full">
                                    Retour
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 rounded-full bg-primary text-white hover:bg-primary/90"
                                >
                                    {loading ? "Envoi..." : "Confirmer"}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="font-serif">
                                Passer au {meta.plan === "premium" ? "Premium" : "Enterprise"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 pt-2">
                            {/* Plan summary */}
                            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-foreground capitalize">{meta.plan}</p>
                                    <p className="text-sm text-muted-foreground">Accès complet à toutes les fonctionnalités</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">
                                        {price.fcfa > 0 ? `${price.fcfa.toLocaleString()} FCFA` : "Sur devis"}
                                    </p>
                                    {price.fcfa > 0 && <p className="text-xs text-muted-foreground">par mois</p>}
                                </div>
                            </div>

                            {/* Payment method */}
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">Moyen de paiement</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {PAYMENT_METHODS.map(m => (
                                        <button
                                            key={m.key}
                                            onClick={() => setSelectedMethod(m.key)}
                                            className={cn(
                                                "flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all",
                                                m.color,
                                                selectedMethod === m.key && "ring-2 ring-primary ring-offset-1"
                                            )}
                                        >
                                            <span className="text-base">{m.icon}</span>
                                            {m.label}
                                            {selectedMethod === m.key && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={() => setStep("confirm")}
                                disabled={!selectedMethod}
                                className="w-full rounded-full bg-primary hover:bg-primary/90 text-white h-11 font-semibold"
                            >
                                Continuer <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <p className="text-center text-xs text-muted-foreground">
                                Votre accès est activé sous 24h après confirmation du paiement.
                            </p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
