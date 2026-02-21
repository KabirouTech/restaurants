import { SupabaseClient } from "@supabase/supabase-js";
import {
  findOrCreateCustomer,
  findOrCreateConversation,
  insertIncomingMessage,
} from "./conversation-helpers";

export async function processWhatsAppWebhook(
  supabase: SupabaseClient,
  body: any
) {
  const entry = body.entry?.[0];
  if (!entry) return;

  const changes = entry.changes?.[0];
  if (!changes || changes.field !== "messages") return;

  const value = changes.value;
  const phoneNumberId = value.metadata?.phone_number_id;
  if (!phoneNumberId) return;

  // Find channel by provider_id
  const { data: channel } = await supabase
    .from("channels")
    .select("id, organization_id, credentials")
    .eq("provider_id", phoneNumberId)
    .eq("platform", "whatsapp")
    .eq("is_active", true)
    .maybeSingle();

  if (!channel) return;

  const messages = value.messages;
  if (!messages || messages.length === 0) return;

  const contacts = value.contacts || [];

  for (const msg of messages) {
    const from = msg.from; // phone number
    const contact = contacts.find((c: any) => c.wa_id === from);
    const name = contact?.profile?.name || from;

    let content = "";
    const attachments: any[] = [];

    switch (msg.type) {
      case "text":
        content = msg.text?.body || "";
        break;
      case "image":
        content = msg.image?.caption || "[Image]";
        attachments.push({
          type: "image",
          media_id: msg.image?.id,
          mime_type: msg.image?.mime_type,
        });
        break;
      case "document":
        content =
          msg.document?.caption ||
          `[Document: ${msg.document?.filename || "fichier"}]`;
        attachments.push({
          type: "document",
          media_id: msg.document?.id,
          filename: msg.document?.filename,
          mime_type: msg.document?.mime_type,
        });
        break;
      case "audio":
        content = "[Audio]";
        attachments.push({
          type: "audio",
          media_id: msg.audio?.id,
          mime_type: msg.audio?.mime_type,
        });
        break;
      case "location":
        content = `[Position: ${msg.location?.latitude}, ${msg.location?.longitude}]`;
        break;
      default:
        content = `[${msg.type}]`;
    }

    const customerId = await findOrCreateCustomer(
      supabase,
      channel.organization_id,
      { phone: from },
      name
    );

    // WhatsApp thread ID = sender phone number
    const { conversationId } = await findOrCreateConversation(
      supabase,
      channel.organization_id,
      customerId,
      channel.id,
      from
    );

    await insertIncomingMessage(
      supabase,
      channel.organization_id,
      conversationId,
      content,
      name,
      msg.id,
      attachments.length > 0 ? attachments : undefined
    );
  }
}

export async function sendWhatsAppMessage(
  credentials: any,
  recipientPhone: string,
  content: string
): Promise<{ externalMessageId?: string; error?: string }> {
  const { phone_number_id, access_token } = credentials;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "text",
          text: { body: content },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error?.message || "WhatsApp API error" };
    }

    return { externalMessageId: data.messages?.[0]?.id };
  } catch (err: any) {
    return { error: err.message || "Network error" };
  }
}
