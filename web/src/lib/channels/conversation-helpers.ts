import { SupabaseClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/firebase-admin";

interface CustomerLookup {
  phone?: string;
  email?: string;
  instagramId?: string;
}

export async function findOrCreateCustomer(
  supabase: SupabaseClient,
  orgId: string,
  lookup: CustomerLookup,
  name?: string
): Promise<string> {
  if (lookup.phone) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone", lookup.phone)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (lookup.email) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .eq("email", lookup.email)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (lookup.instagramId) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .eq("instagram_username", lookup.instagramId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const insert: Record<string, any> = { organization_id: orgId };
  if (name) insert.full_name = name;
  if (lookup.phone) insert.phone = lookup.phone;
  if (lookup.email) insert.email = lookup.email;
  if (lookup.instagramId) insert.instagram_username = lookup.instagramId;

  const { data, error } = await supabase
    .from("customers")
    .insert(insert)
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create customer: " + error?.message);
  return data.id;
}

export async function findOrCreateConversation(
  supabase: SupabaseClient,
  orgId: string,
  customerId: string,
  channelId: string,
  externalThreadId?: string
): Promise<{ conversationId: string; isNew: boolean }> {
  if (externalThreadId) {
    const { data } = await supabase
      .from("conversations")
      .select("id")
      .eq("channel_id", channelId)
      .eq("external_thread_id", externalThreadId)
      .maybeSingle();

    if (data?.id) return { conversationId: data.id, isNew: false };
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      channel_id: channelId,
      external_thread_id: externalThreadId || null,
      status: "open",
      unread_count: 0,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create conversation: " + error?.message);
  return { conversationId: data.id, isNew: true };
}

export async function insertIncomingMessage(
  supabase: SupabaseClient,
  orgId: string,
  conversationId: string,
  content: string,
  senderName: string,
  externalMessageId?: string,
  attachments?: any[]
) {
  const msgInsert: Record<string, any> = {
    conversation_id: conversationId,
    sender_type: "customer",
    content,
  };
  if (externalMessageId) msgInsert.external_message_id = externalMessageId;
  if (attachments && attachments.length > 0) msgInsert.attachments = attachments;

  const { error } = await supabase.from("messages").insert(msgInsert);

  if (error) throw new Error("Failed to insert message: " + error.message);

  // Increment unread_count
  const { data: conv } = await supabase
    .from("conversations")
    .select("unread_count")
    .eq("id", conversationId)
    .single();

  await supabase
    .from("conversations")
    .update({
      unread_count: (conv?.unread_count || 0) + 1,
      last_message_at: new Date().toISOString(),
      status: "open",
    })
    .eq("id", conversationId);

  // Send push notifications to org members
  try {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("organization_id", orgId)
      .not("fcm_token", "is", null);

    if (profiles && profiles.length > 0) {
      const preview = content.slice(0, 100);
      await Promise.allSettled(
        profiles.map((p) =>
          sendPushNotification(
            p.fcm_token!,
            `Nouveau message de ${senderName}`,
            preview,
            { url: "/dashboard/inbox" }
          )
        )
      );
    }
  } catch {
    // Push failure should not break message processing
  }
}
