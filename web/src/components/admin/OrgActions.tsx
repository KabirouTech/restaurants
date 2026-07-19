"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleOrgActiveAction, changeOrgPlanAction, revokePremiumGiftAction } from "@/actions/admin/organizations";
import { GiftPremiumDialog } from "@/components/admin/GiftPremiumDialog";
import { toast } from "sonner";
import { Loader2, Gift, X } from "lucide-react";

interface OrgActionsProps {
    orgId: string;
    isActive: boolean;
    currentPlan: string;
    settings?: Record<string, any>;
}

export function OrgActions({ orgId, isActive, currentPlan, settings }: OrgActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [plan, setPlan] = useState(currentPlan);
    const [giftOpen, setGiftOpen] = useState(false);

    const isGifted = settings?.premium_gift === true;
    const giftExpiresAt = settings?.premium_gift_expires_at;
    const isGiftExpired = giftExpiresAt ? new Date(giftExpiresAt) < new Date() : false;

    const handleToggleActive = () => {
        startTransition(async () => {
            const result = await toggleOrgActiveAction(orgId, !isActive);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isActive ? "Organisation désactivée" : "Organisation activée");
            }
        });
    };

    const handleChangePlan = (newPlan: string) => {
        setPlan(newPlan);
        startTransition(async () => {
            const result = await changeOrgPlanAction(orgId, newPlan);
            if (result.error) {
                toast.error(result.error);
                setPlan(currentPlan);
            } else {
                toast.success(`Plan changé vers ${newPlan}`);
            }
        });
    };

    const handleRevokeGift = () => {
        startTransition(async () => {
            const result = await revokePremiumGiftAction(orgId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Cadeau Premium révoqué");
                setPlan("free");
            }
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant={isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={handleToggleActive}
                    disabled={isPending}
                >
                    {isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    {isActive ? "Désactiver" : "Activer"}
                </Button>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Plan :</span>
                    <select
                        value={plan}
                        onChange={(e) => handleChangePlan(e.target.value)}
                        disabled={isPending}
                        className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground"
                    >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGiftOpen(true)}
                    disabled={isPending}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                    <Gift className="h-3.5 w-3.5 mr-1.5" />
                    {isGifted && !isGiftExpired ? "Modifier le cadeau" : "Offrir Premium"}
                </Button>
            </div>

            {/* Gift status banner */}
            {isGifted && (
                <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    isGiftExpired
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                    <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 shrink-0" />
                        {isGiftExpired ? (
                            <span>Cadeau Premium expiré le {new Date(giftExpiresAt).toLocaleDateString("fr-FR")}</span>
                        ) : (
                            <span>
                                Premium offert — expire le{" "}
                                {new Date(giftExpiresAt).toLocaleDateString("fr-FR", {
                                    day: "numeric", month: "long", year: "numeric",
                                })}
                                {settings?.premium_gift_days ? <> ({settings.premium_gift_days}j)</> : null}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs shrink-0 hover:bg-red-100 text-red-600"
                        onClick={handleRevokeGift}
                        disabled={isPending}
                    >
                        <X className="h-3 w-3 mr-1" />
                        Révoquer
                    </Button>
                </div>
            )}

            <GiftPremiumDialog
                orgId={orgId}
                open={giftOpen}
                onOpenChange={setGiftOpen}
                onGifted={() => setPlan("premium")}
            />
        </div>
    );
}
