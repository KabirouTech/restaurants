"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";
import {
  createInstagramConnectSession,
  getInstagramClient,
  instagramClientRefForOrg,
  IntelliAPIError,
} from "@/lib/intelli/partner-client";

/**
 * Start the hosted Instagram connect. Returns an Intelli-hosted URL the client
 * opens in a popup (single-use, valid 10 minutes). Only our `ik_` key leaves
 * the server — Meta credentials stay on Intelli's domain.
 */
export async function startIntelliInstagramConnectAction() {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  try {
    const session = await createInstagramConnectSession({
      clientRef: instagramClientRefForOrg(organizationId),
    });
    return { url: session.url };
  } catch (err) {
    if (err instanceof IntelliAPIError) {
      if (err.code === "account_already_connected") {
        return {
          error:
            "Ce compte Instagram est déjà connecté (ici ou via un autre fournisseur). Déconnectez-le d'abord, puis réessayez.",
        };
      }
      return { error: `Impossible de démarrer la connexion: ${err.message}` };
    }
    return {
      error: err instanceof Error ? err.message : "Échec du démarrage.",
    };
  }
}

/**
 * Finalize the connection after the hosted popup signals success. Trust comes
 * only from our own server-to-server fetch with the `ik_` key — the client_ref
 * is derived from the org server-side, never taken from the browser message.
 */
export async function finalizeIntelliInstagramAction() {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  const clientRef = instagramClientRefForOrg(organizationId);

  let client;
  try {
    client = await getInstagramClient(clientRef);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Échec de la vérification.",
    };
  }

  if (!client) {
    // The hosted flow hasn't provisioned the client yet (e.g. closed early).
    return { error: "La connexion n'a pas été finalisée. Réessayez." };
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const credentials = {
    via: "intelli" as const,
    client_ref: client.client_ref,
    ig_user_id: client.ig_user_id,
    username: client.username,
    business_name: client.business_name,
  };
  const name =
    client.username || client.business_name || "Instagram";

  const { data: existing } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("platform", "instagram")
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("channels")
      .update({
        name,
        provider_id: client.ig_user_id || client.client_ref,
        credentials,
        is_active: true,
      })
      .eq("id", existing.id)
      .eq("organization_id", organizationId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/settings");
    return { channelId: existing.id, client };
  }

  const { data: channel, error } = await supabaseAdmin
    .from("channels")
    .insert({
      organization_id: organizationId,
      platform: "instagram",
      name,
      provider_id: client.ig_user_id || client.client_ref,
      credentials,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  return { channelId: channel.id, client };
}
