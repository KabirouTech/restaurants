import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { MessageCircle, Webhook, Plug } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { pingIntelliConnection } from "@/lib/intelli/partner-client";
import { IntelliConnectionCard } from "@/components/admin/IntelliConnectionCard";
import {
  IntelliWebhooksViewer,
  type WebhookEventRow,
} from "@/components/admin/IntelliWebhooksViewer";

export const dynamic = "force-dynamic";

export default async function AdminIntelliPage() {
  const { userId, profile } = await getCurrentProfile();
  if (!userId) redirect("/sign-in");
  if (!profile?.is_super_admin) redirect("/dashboard");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Connection status + WhatsApp footprint, in parallel.
  const [status, eventsRes, channelsRes] = await Promise.all([
    pingIntelliConnection(),
    admin
      .from("webhook_events")
      .select("id, provider, status, error_log, created_at, payload")
      .in("provider", ["intelli", "whatsapp"])
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("channels")
      .select("id", { count: "exact", head: true })
      .eq("platform", "whatsapp")
      .eq("is_active", true),
  ]);

  const events: WebhookEventRow[] = (eventsRes.data || []).map((e) => {
    const payload = e.payload as Record<string, unknown> | null;
    return {
      id: e.id,
      provider: e.provider,
      status: e.status,
      error_log: e.error_log,
      created_at: e.created_at,
      event:
        (payload?.event as string) ||
        (payload?.type as string) ||
        ((payload?.object as string) ? `meta:${payload?.object}` : null),
      payload: e.payload,
    };
  });

  const connectedCount = channelsRes.count ?? 0;

  // Derive the public webhook URL from the request host.
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const webhookUrl = `${proto}://${host}/api/webhooks/intelli`;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center px-4 md:px-8 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-serif flex items-center gap-2">
            <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
            WhatsApp · Intelli
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {connectedCount} organisation{connectedCount > 1 ? "s" : ""} avec WhatsApp connecté
          </p>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-8 max-w-4xl w-full">
        {/* Connection */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Plug className="h-4 w-4" />
            Connexion au portail Intelli
          </h2>
          <IntelliConnectionCard initialStatus={status} webhookUrl={webhookUrl} />
        </section>

        {/* Webhooks */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Webhook className="h-4 w-4" />
            Webhooks reçus
            <span className="text-xs font-normal normal-case tracking-normal">
              ({events.length} dernier{events.length > 1 ? "s" : ""})
            </span>
          </h2>
          <IntelliWebhooksViewer events={events} />
        </section>
      </div>
    </div>
  );
}
