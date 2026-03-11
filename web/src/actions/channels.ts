"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";

export async function connectChannelAction(
  platform: string,
  name: string,
  providerId: string,
  credentials: Record<string, any>
) {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Check if channel already exists for this platform
  const { data: existing } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("platform", platform)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("channels")
      .update({ name, provider_id: providerId, credentials, is_active: true })
      .eq("id", existing.id)
      .eq("organization_id", organizationId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/settings");
    return { channelId: existing.id };
  }

  const { data: channel, error } = await supabaseAdmin
    .from("channels")
    .insert({
      organization_id: organizationId,
      platform,
      name,
      provider_id: providerId,
      credentials,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  return { channelId: channel.id };
}

export async function disconnectChannelAction(channelId: string) {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: channel } = await supabaseAdmin
    .from("channels")
    .select("id")
    .eq("id", channelId)
    .eq("organization_id", organizationId)
    .single();

  if (!channel) return { error: "Canal introuvable" };

  const { error } = await supabaseAdmin
    .from("channels")
    .update({ is_active: false })
    .eq("id", channelId)
    .eq("organization_id", organizationId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function testWhatsAppConnectionAction(channelId: string) {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: channel } = await supabaseAdmin
    .from("channels")
    .select("credentials")
    .eq("id", channelId)
    .eq("organization_id", organizationId)
    .single();

  if (!channel) return { error: "Canal introuvable" };

  const { phone_number_id, access_token } = channel.credentials as any;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phone_number_id}?access_token=${access_token}`
    );
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error?.message || "Erreur API Meta" };
    }

    return {
      success: true,
      phoneNumber: data.display_phone_number || data.verified_name,
    };
  } catch (err: any) {
    return { error: err.message || "Erreur réseau" };
  }
}

export async function fetchChannelsAction() {
  const orgContext = await getRequiredOrganizationContext("Aucune organisation");
  if (!orgContext.ok) return { error: orgContext.error };
  const { organizationId } = orgContext.context;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: channels } = await supabaseAdmin
    .from("channels")
    .select("id, platform, name, provider_id, is_active, created_at")
    .eq("organization_id", organizationId)
    .neq("platform", "website");

  return { channels: channels || [] };
}
