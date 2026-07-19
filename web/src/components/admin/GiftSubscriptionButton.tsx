"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftPremiumDialog } from "@/components/admin/GiftPremiumDialog";

/** Bouton « Offrir Premium » par ligne sur la page admin Abonnements. */
export function GiftSubscriptionButton({
    orgId,
    orgName,
    gifted,
}: {
    orgId: string;
    orgName?: string;
    gifted?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => setOpen(true)}
            >
                <Gift className="h-3 w-3 mr-1" />
                {gifted ? "Modifier" : "Offrir"}
            </Button>
            <GiftPremiumDialog
                orgId={orgId}
                orgName={orgName}
                open={open}
                onOpenChange={setOpen}
                onGifted={() => router.refresh()}
            />
        </>
    );
}
