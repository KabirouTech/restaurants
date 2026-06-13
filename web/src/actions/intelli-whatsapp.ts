"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";
import {
  createEmbeddedSignupSession,
  getClient,
  clientRefForOrg,
  IntelliAPIError,
} from "@/lib/intelli/partner-client";

/**
 * Start the hosted WhatsApp embedded signup. Returns an Intelli-hosted URL the
 * client opens in a popup. Only our `ik_` key leaves the server — Intelli's Meta
 * credentials stay on Intelli's domain.
 */
export async function startIntelliWhatsAppSignupAction() {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  try {
    const session = await createEmbeddedSignupSession({
      clientRef: clientRefForOrg(organizationId),
    });
    return { url: session.url };
  } catch (err) {
    if (err instanceof IntelliAPIError) {
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
export async function finalizeIntelliWhatsAppAction() {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  const clientRef = clientRefForOrg(organizationId);

  let client;
  try {
    client = await getClient(clientRef);
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
    waba_id: client.waba_id,
    phone_number_id: client.phone_number_id,
    phone_number: client.phone_number,
    business_name: client.business_name,
  };
  const name = client.business_name || "WhatsApp Business";

  const { data: existing } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("platform", "whatsapp")
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("channels")
      .update({
        name,
        provider_id: client.phone_number_id,
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
      platform: "whatsapp",
      name,
      provider_id: client.phone_number_id,
      credentials,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  return { channelId: channel.id, client };
}
