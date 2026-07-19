"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  startIntelliInstagramConnectAction,
  finalizeIntelliInstagramAction,
} from "@/actions/intelli-instagram";

type Step = "initial" | "popup" | "finalizing" | "done";

/**
 * One-click Instagram DM onboarding through Intelli's hosted connect flow.
 *
 * We never touch Meta credentials: a server action mints a hosted session URL
 * (using our ik_ key, server-side), we open it in a popup, and Intelli's own
 * page runs the Instagram login/consent. On success the popup posts a message
 * back; we then confirm the result server-to-server before persisting the
 * channel — the message is a hint only, never trusted.
 */
export function IntelliInstagramConnect({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const [step, setStep] = useState<Step>("initial");
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const handledRef = useRef(false);

  const finalize = useCallback(async () => {
    if (handledRef.current) return;
    handledRef.current = true;
    setStep("finalizing");
    setError(null);
    const result = await finalizeIntelliInstagramAction();
    if (result.error) {
      setError(result.error);
      setStep("initial");
      handledRef.current = false;
      toast.error(result.error);
      return;
    }
    setStep("done");
    toast.success("Instagram connecté via Intelli");
    onConnected?.();
  }, [onConnected]);

  // Listen for the hosted popup's success message. The message only triggers
  // finalize(); the actual client data is re-fetched server-side (ik_ key), so
  // a spoofed message can't connect a channel we don't own.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "intelli:instagram" && event.data?.status === "success") {
        finalize();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [finalize]);

  const launch = useCallback(async () => {
    setError(null);
    setStep("popup");
    handledRef.current = false;

    const result = await startIntelliInstagramConnectAction();
    if (result.error || !result.url) {
      setError(result.error || "Impossible de démarrer la connexion.");
      setStep("initial");
      return;
    }

    const popup = window.open(
      result.url,
      "intelli-instagram-connect",
      "width=600,height=720,menubar=no,toolbar=no"
    );
    if (!popup) {
      setError("La popup a été bloquée. Autorisez les popups et réessayez.");
      setStep("initial");
      return;
    }
    popupRef.current = popup;

    // If the user closes the popup without finishing, reset to allow a retry.
    // Sessions are single-use and expire after 10 minutes — a retry mints a
    // fresh one.
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        if (!handledRef.current) {
          setStep((s) => (s === "popup" ? "initial" : s));
        }
      }
    }, 800);
  }, []);

  if (step === "done") {
    return (
      <p className="text-xs text-green-600">
        Instagram connecté via Intelli. Vous pouvez recevoir et répondre aux DMs.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        onClick={launch}
        disabled={step === "popup" || step === "finalizing"}
        className="bg-[#E1306C] hover:bg-[#c02456] text-white"
      >
        {step === "finalizing" ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <Instagram className="h-3 w-3 mr-1" />
        )}
        {step === "finalizing"
          ? "Finalisation…"
          : step === "popup"
            ? "Connexion en cours…"
            : "Connecter avec Instagram"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Onboarding hébergé par Intelli — aucun token ni identifiant Meta à configurer.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
