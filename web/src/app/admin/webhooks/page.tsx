import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { fetchWebhookDashboard } from "./actions";
import { WebhooksClient } from "./WebhooksClient";
import type { WebhookFilters } from "./types";

export const dynamic = "force-dynamic";

const DEFAULT_FILTERS: WebhookFilters = {
  range: "24h",
  provider: null,
  status: null,
  search: "",
};

export default async function AdminWebhooksPage() {
  const { userId, profile } = await getCurrentProfile();
  if (!userId) redirect("/sign-in");
  if (!profile?.is_super_admin) redirect("/dashboard");

  const initial = await fetchWebhookDashboard(DEFAULT_FILTERS);

  // Endpoint URLs are derived from the request host so they're copy-pasteable
  // into the Meta / Intelli consoles straight from whichever env you're on.
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;

  return (
    <WebhooksClient
      initialData={initial}
      initialFilters={DEFAULT_FILTERS}
      baseUrl={baseUrl}
    />
  );
}
