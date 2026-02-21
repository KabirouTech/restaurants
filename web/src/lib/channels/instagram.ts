import { SupabaseClient } from "@supabase/supabase-js";
import {
  findOrCreateCustomer,
  findOrCreateConversation,
  insertIncomingMessage,
} from "./conversation-helpers";

export async function processInstagramWebhook(
  supabase: SupabaseClient,
  body: any
) {
  const entry = body.entry?.[0];
  if (!entry) return;

  const messaging = entry.messaging?.[0];
  if (!messaging) return;

  const senderId = messaging.sender?.id;
  const recipientId = messaging.recipient?.id;
  const message = messaging.message;

  if (!senderId || !recipientId || !message) return;

  // Skip echo messages (sent by us)
  if (message.is_echo) return;

  // Find channel by provider_id = our Instagram page/account ID
  const { data: channel } = await supabase
    .from("channels")
    .select("id, organization_id, credentials")
    .eq("provider_id", recipientId)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .maybeSingle();

  if (!channel) return;

  // Get sender profile name
  let senderName = senderId;
  try {
    const { access_token } = channel.credentials as any;
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${senderId}?fields=name,username&access_token=${access_token}`
    );
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      senderName = profileData.name || profileData.username || senderId;
    }
  } catch {
    // Use senderId as fallback name
  }

  let content = message.text || "";
  const attachments: any[] = [];

  if (message.attachments) {
    for (const att of message.attachments) {
      attachments.push({ type: att.type, url: att.payload?.url });
      if (!content) content = `[${att.type === "image" ? "Image" : att.type === "video" ? "Vidéo" : att.type}]`;
    }
  }

  const customerId = await findOrCreateCustomer(
    supabase,
    channel.organization_id,
    { instagramId: senderId },
    senderName
  );

  const threadId = `${senderId}_${recipientId}`;

  const { conversationId } = await findOrCreateConversation(
    supabase,
    channel.organization_id,
    customerId,
    channel.id,
    threadId
  );

  await insertIncomingMessage(
    supabase,
    channel.organization_id,
    conversationId,
    content,
    senderName,
    message.mid,
    attachments.length > 0 ? attachments : undefined
  );
}

export async function sendInstagramMessage(
  credentials: any,
  recipientId: string,
  content: string
): Promise<{ externalMessageId?: string; error?: string }> {
  const { page_id, access_token } = credentials;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${page_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: content },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error?.message || "Instagram API error" };
    }

    return { externalMessageId: data.message_id };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}
