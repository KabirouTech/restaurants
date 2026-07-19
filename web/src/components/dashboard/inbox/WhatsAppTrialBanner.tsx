"use client";

import { useState } from "react";
import { Clock, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UpgradeDialog } from "@/components/dashboard/PlanGate";

/**
 * Slim banner shown above the inbox while an org is inside its 7-day WhatsApp
 * free trial. Turns amber→red as the window closes and opens the standard
 * Premium upgrade dialog (shared with PlanGate) on click.
 */
export function WhatsAppTrialBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  if (dismissed) return null;

  const urgent = daysLeft <= 2;
  const dayText =
    daysLeft <= 0
      ? "Dernier jour"
      : `${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-xs md:text-sm border-b",
          urgent
            ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
            : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300"
        )}
      >
        <Clock className="h-4 w-4 shrink-0" />
        <span className="font-medium">Essai WhatsApp gratuit — {dayText}</span>
        <button
          type="button"
          onClick={() => setShowUpgrade(true)}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold text-white shadow-sm transition-colors",
            urgent ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
          )}
        >
          <Sparkles className="h-3 w-3" />
          Passer au Premium
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 opacity-60 hover:opacity-100"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <UpgradeDialog
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="unified_inbox"
      />
    </>
  );
}
