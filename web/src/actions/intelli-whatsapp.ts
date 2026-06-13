"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";
import {
  intelliSignupClient,
  clientRefForOrg,
  IntelliAPIError,
} from "@/lib/intelli/partner-client";

/**
 * Onboard the organization's WhatsApp number through Intelli's embedded signup.
 *
 * The Meta auth code captured client-side by the embedded signup popup is
 * exchanged by Intelli (which holds the Meta app secret), provisioning the WABA
 * under Intelli. We persist a `channels` row whose credentials route future
 * sends through the Partner API (no Meta token ever touches RestaurantsOS).
 */
export async function connectWhatsAppViaIntelliAction(authCode: string) {
  if (!authCode?.trim()) {
    return { error: "Code d'autorisation Meta manquant." };
  }

  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  const clientRef = clientRefForOrg(organizationId);

  let client;
  try {
    client = await intelliSignupClient({ authCode: authCode.trim(), clientRef });
  } catch (err) {
    if (err instanceof IntelliAPIError) {
      // 409 means this org already onboarded a client on Intelli's side. Treat
      // it as recoverable: the channel row below will be (re)activated, but we
      // can't re-fetch the client details from a conflict, so surface a hint.
      return { error: `Échec de la connexion via Intelli: ${err.message}` };
    }
    return {
      error:
        err instanceof Error ? err.message : "Échec de la connexion via Intelli.",
    };
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
