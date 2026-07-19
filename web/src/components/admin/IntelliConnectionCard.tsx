"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Server,
  KeyRound,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { testIntelliConnectionAction } from "@/actions/admin/intelli";
import type { IntelliConnectionStatus } from "@/lib/intelli/partner-client";

/**
 * Admin view of the RestaurantsOS ⇄ Intelli Partner connection: env config,
 * a live "test connection" ping, and the webhook URL to register in the Intelli
 * portal. No secret values are ever shown — only presence and a masked hint.
 */
export function IntelliConnectionCard({
  initialStatus,
  webhookUrl,
}: {
  initialStatus: IntelliConnectionStatus;
  webhookUrl: string;
}) {
  const [status, setStatus] = useState<IntelliConnectionStatus>(initialStatus);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      setStatus(await testIntelliConnectionAction());
    } finally {
      setTesting(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Status header */}
      <div className="p-4 md:p-5 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
              status.ok
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-600"
            )}
          >
            {status.ok ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">
              {status.ok ? "Connecté à Intelli" : "Connexion indisponible"}
            </p>
            <p className="text-xs text-muted-foreground">{status.message}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={runTest} disabled={testing}>
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
          )}
          Tester
        </Button>
      </div>

      {/* Config rows */}
      <div className="divide-y divide-border">
        <ConfigRow
          icon={<Server className="h-4 w-4" />}
          label="Base API"
          value={status.base}
          ok
          mono
        />
        <ConfigRow
          icon={<KeyRound className="h-4 w-4" />}
          label="Clé partenaire"
          value={status.keyConfigured ? `${status.keyHint} configurée` : "Non configurée"}
          ok={status.keyConfigured}
          mono
        />
        <ConfigRow
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Secret webhook"
          value={status.webhookSecretConfigured ? "Configuré" : "Non configuré"}
          ok={status.webhookSecretConfigured}
        />

        {/* Webhook URL to register */}
        <div className="p-4 md:p-5 flex items-start gap-3">
          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <Webhook className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">URL Webhook à enregistrer</p>
            <p className="text-xs text-muted-foreground mb-2">
              Dans le portail Intelli → Settings → webhook_url
            </p>
            <div className="flex gap-1">
              <code className="flex-1 min-w-0 truncate rounded-md border border-border bg-muted/40 px-2 py-1.5 text-xs font-mono">
                {webhookUrl}
              </code>
              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={copyWebhook}>
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({
  icon,
  label,
  value,
  ok,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
  mono?: boolean;
}) {
  return (
    <div className="p-4 md:p-5 flex items-center gap-3">
      <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <p className="text-sm font-medium w-32 shrink-0">{label}</p>
      <p className={cn("text-xs flex-1 min-w-0 truncate", mono && "font-mono", ok ? "text-foreground" : "text-red-600")}>
        {value}
      </p>
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
      )}
    </div>
  );
}
