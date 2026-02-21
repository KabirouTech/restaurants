"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleOrgActiveAction, changeOrgPlanAction } from "@/actions/admin/organizations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OrgActionsProps {
    orgId: string;
    isActive: boolean;
    currentPlan: string;
}

export function OrgActions({ orgId, isActive, currentPlan }: OrgActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [plan, setPlan] = useState(currentPlan);

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

    return (
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
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                </select>
            </div>
        </div>
    );
}
