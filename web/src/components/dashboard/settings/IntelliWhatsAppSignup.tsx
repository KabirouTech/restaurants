"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { connectWhatsAppViaIntelliAction } from "@/actions/intelli-whatsapp";

// Minimal Facebook JS SDK surface used by the embedded signup flow.
declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        cb: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>
      ) => void;
      AppEvents?: { logPageView: () => void };
    };
    fbAsyncInit?: () => void;
  }
}

type Step = "initial" | "popup" | "connecting" | "done";

/**
 * One-click WhatsApp onboarding via Intelli's embedded signup. Launches Meta's
 * popup using Intelli's Facebook app config, then hands the returned auth code
 * to the server, which provisions the number through the Partner API.
 *
 * Uses Intelli's public Meta credentials (safe to expose):
 *   NEXT_PUBLIC_INTELLI_FB_APP_ID
 *   NEXT_PUBLIC_INTELLI_FB_CONFIG_ID
 */
export function IntelliWhatsAppSignup({
  onConnected,
}: {
  onConnected?: () => void;
}) {
  const [step, setStep] = useState<Step>("initial");
  const [error, setError] = useState<string | null>(null);
  const fbReady = useRef<Promise<void> | null>(null);
  const sessionInfo = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  const appId = process.env.NEXT_PUBLIC_INTELLI_FB_APP_ID;
  const configId = process.env.NEXT_PUBLIC_INTELLI_FB_CONFIG_ID;

  const initSDK = useCallback((): Promise<void> => {
    if (fbReady.current) return fbReady.current;
    fbReady.current = new Promise<void>((resolve, reject) => {
      if (typeof window === "undefined") return;
      if (window.FB) return resolve();
      if (!appId) return reject(new Error("Configuration Meta Intelli manquante."));

      window.fbAsyncInit = () => {
        window.FB?.init({ appId, cookie: true, xfbml: true, version: "v22.0" });
        window.FB?.AppEvents?.logPageView();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onerror = () =>
        reject(new Error("Impossible de charger le SDK Facebook."));
      document.body.appendChild(script);
    });
    return fbReady.current;
  }, [appId]);

  // Capture the session info Meta posts via window.message during the flow.
  useEffect(() => {
    initSDK().catch(() => {});
    const onMessage = (event: MessageEvent) => {
      if (
        !["https://www.facebook.com", "https://web.facebook.com"].includes(
          event.origin
        )
      )
        return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP" && data.data) {
          sessionInfo.current = {
            phone_number_id: data.data.phone_number_id,
            waba_id: data.data.waba_id,
          };
        }
      } catch {
        // non-JSON cross-origin noise; ignore
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [initSDK]);

  const submitCode = useCallback(
    async (code: string) => {
      setStep("connecting");
      setError(null);
      const result = await connectWhatsAppViaIntelliAction(code);
      if (result.error) {
        setError(result.error);
        setStep("initial");
        toast.error(result.error);
        return;
      }
      setStep("done");
      toast.success("WhatsApp connecté via Intelli");
      onConnected?.();
    },
    [onConnected]
  );

  const launch = useCallback(async () => {
    setError(null);

    if (!configId) {
      const msg = "La connexion WhatsApp n'est pas disponible (config Intelli manquante).";
      setError(msg);
      return;
    }
    // Meta enforces HTTPS for FB.login; on plain http the SDK silently no-ops.
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setError("WhatsApp ne peut être connecté que depuis la version sécurisée (https) du site.");
      return;
    }

    try {
      setStep("popup");
      await initSDK();
      if (!window.FB) throw new Error("SDK Facebook indisponible.");

      window.FB.login(
        (response) => {
          const code = response.authResponse?.code;
          if (code) {
            submitCode(code);
          } else {
            setStep("initial");
            setError("Connexion annulée ou refusée.");
          }
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            version: "v3",
            featureType: "whatsapp_business_app_onboarding",
            sessionInfoVersion: "3",
          },
        }
      );
    } catch (err) {
      setStep("initial");
      setError(err instanceof Error ? err.message : "Échec du lancement de la connexion.");
    }
  }, [configId, initSDK, submitCode]);

  if (step === "done") {
    return (
      <p className="text-xs text-green-600">
        WhatsApp connecté via Intelli. Vous pouvez recevoir et envoyer des messages.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        onClick={launch}
        disabled={step === "popup" || step === "connecting"}
        className="bg-[#25D366] hover:bg-[#1da851] text-white"
      >
        {step === "connecting" ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <MessageCircle className="h-3 w-3 mr-1" />
        )}
        {step === "connecting"
          ? "Connexion…"
          : step === "popup"
            ? "Ouverture de Meta…"
            : "Connecter avec WhatsApp"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Onboarding géré par Intelli — aucun token Meta à configurer.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
