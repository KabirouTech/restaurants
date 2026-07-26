import { SupabaseClient } from "@supabase/supabase-js";
import {
  findOrCreateCustomer,
  findOrCreateConversation,
  insertIncomingMessage,
} from "./conversation-helpers";
import { ignored, processed, type WebhookResult } from "@/lib/webhooks/recorder";
import type { OutgoingMedia } from "./index";

export async function processWhatsAppWebhook(
  supabase: SupabaseClient,
  body: any
): Promise<WebhookResult> {
  const entry = body.entry?.[0];
  if (!entry) return ignored("Payload sans entry[0]");

  const changes = entry.changes?.[0];
  if (!changes) return ignored("Payload sans changes[0]");
  if (changes.field !== "messages")
    return ignored(`Champ non géré: ${changes.field}`, { eventType: `whatsapp:${changes.field}` });

  const value = changes.value;
  const phoneNumberId = value?.metadata?.phone_number_id;
  if (!phoneNumberId) return ignored("Aucun phone_number_id dans metadata");

  // Find channel by provider_id
  const { data: channel } = await supabase
    .from("channels")
    .select("id, organization_id, credentials")
    .eq("provider_id", phoneNumberId)
    .eq("platform", "whatsapp")
    .eq("is_active", true)
    .maybeSingle();

  if (!channel)
    return ignored(`Aucun canal WhatsApp actif pour phone_number_id ${phoneNumberId}`);

  const messages = value.messages;
  if (!messages || messages.length === 0) {
    // Delivery/read receipts land here — expected, not a problem.
    const statusUpdate = value.statuses?.[0]?.status;
    return ignored(
      statusUpdate ? `Accusé de statut: ${statusUpdate}` : "Aucun message entrant",
      { organizationId: channel.organization_id, eventType: statusUpdate ? "whatsapp:status" : null }
    );
  }

  const contacts = value.contacts || [];
  let inserted = 0;

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
    inserted++;
  }

  return processed({
    organizationId: channel.organization_id,
    messages: inserted,
    eventType: "whatsapp:message.received",
  });
}

export async function sendWhatsAppMessage(
  credentials: any,
  recipientPhone: string,
  content: string,
  attachments: OutgoingMedia[] = []
): Promise<{ externalMessageId?: string; error?: string }> {
  const media = attachments[0];

  // Channels onboarded through Intelli's embedded signup have no Meta token of
  // their own — relay the send through the Partner API instead of Graph.
  if (credentials?.via === "intelli") {
    const { intelliSendMessage } = await import("@/lib/intelli/partner-client");
    try {
      const result = await intelliSendMessage({
        clientRef: credentials.client_ref,
        to: recipientPhone,
        text: content,
        media: media
          ? { type: media.type, url: media.url, filename: media.filename }
          : undefined,
      });
      return { externalMessageId: result.message_id ?? undefined };
    } catch (err: any) {
      return { error: err?.message || "Intelli send error" };
    }
  }

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
          ...(media
            ? {
                type: media.type,
                [media.type]: {
                  link: media.url,
                  ...(content && media.type !== "audio" ? { caption: content } : {}),
                  ...(media.type === "document" && media.filename
                    ? { filename: media.filename }
                    : {}),
                },
              }
            : { type: "text", text: { body: content } }),
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
