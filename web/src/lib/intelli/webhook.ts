import { SupabaseClient } from "@supabase/supabase-js";
import {
  findOrCreateCustomer,
  findOrCreateConversation,
  insertIncomingMessage,
} from "@/lib/channels/conversation-helpers";

/**
 * Shape of the normalized payload Intelli forwards to a partner webhook.
 * See intelliholdings-backend `partner/tasks.py::forward_webhook_to_partner`.
 */
interface IntelliMessage {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; caption?: string; mime_type?: string };
  document?: {
    id?: string;
    caption?: string;
    filename?: string;
    mime_type?: string;
  };
  audio?: { id?: string };
}

export interface IntelliWebhookPayload {
  event: string; // message.received | message.status | message.reaction
  timestamp?: string;
  client_ref?: string;
  phone_number?: string;
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: IntelliMessage[];
  statuses?: Array<Record<string, unknown>>;
}

interface MessageAttachment {
  type: string;
  media_id?: string;
  mime_type?: string;
  filename?: string;
}

/**
 * Process an inbound webhook delivered by Intelli. Unlike the raw Meta webhook,
 * the payload is already normalized and the channel is resolved by `client_ref`
 * (stored in channels.credentials when the client was onboarded via Intelli).
 *
 * The signature must be verified by the caller before invoking this.
 */
export async function processIntelliWebhook(
  supabase: SupabaseClient,
  body: IntelliWebhookPayload
) {
  // Only inbound customer messages create conversation activity.
  if (body.event !== "message.received") return;

  const clientRef = body.client_ref;
  if (!clientRef) return;

  const messages = body.messages;
  if (!messages || messages.length === 0) return;

  // Resolve the channel for this Intelli client. credentials is JSONB holding
  // { via: 'intelli', client_ref, ... } set at onboarding time.
  const { data: channel } = await supabase
    .from("channels")
    .select("id, organization_id")
    .eq("platform", "whatsapp")
    .eq("is_active", true)
    .eq("credentials->>client_ref", clientRef)
    .maybeSingle();

  if (!channel) return;

  const contacts = body.contacts || [];

  for (const msg of messages) {
    const from = msg.from;
    if (!from) continue;

    const contact = contacts.find((c) => c.wa_id === from);
    const name = contact?.profile?.name || from;

    let content = "";
    const attachments: MessageAttachment[] = [];

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
        content = msg.document?.caption || msg.document?.filename || "[Document]";
        attachments.push({
          type: "document",
          media_id: msg.document?.id,
          mime_type: msg.document?.mime_type,
          filename: msg.document?.filename,
        });
        break;
      case "audio":
        content = "[Audio]";
        attachments.push({ type: "audio", media_id: msg.audio?.id });
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

    const { conversationId } = await findOrCreateConversation(
      supabase,
      channel.organization_id,
      customerId,
      channel.id,
      from // external_thread_id keyed by the customer wa_id
    );

    await insertIncomingMessage(
      supabase,
      channel.organization_id,
      conversationId,
      content,
      name,
      msg.id,
      attachments
    );
  }
}
