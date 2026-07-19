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

/** Instagram message inside an Intelli event: sender.id is the IGSID to reply to. */
interface IntelliInstagramMessage {
  id?: string;
  sender?: { id?: string; username?: string };
  type?: string;
  text?: { body?: string } | string;
  attachments?: Array<{ type?: string; url?: string }>;
}

export interface IntelliWebhookPayload {
  // WhatsApp: message.received | message.status | message.reaction
  // Instagram: message.received | message.echo | message.reaction |
  //            message.read | message.postback
  event: string;
  channel?: string; // "whatsapp" | "instagram" (absent on legacy payloads)
  timestamp?: string;
  client_ref?: string;
  phone_number?: string;
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: Array<IntelliMessage & IntelliInstagramMessage>;
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
  if (body.channel === "instagram") {
    return processIntelliInstagramEvent(supabase, body);
  }

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

/**
 * Process an Instagram event forwarded by Intelli. Only message.received
 * creates conversation activity; echo/reaction/read/postback are ack'd and
 * dropped. Intelli retries failed deliveries and events can be redelivered
 * manually, so inserts are deduped by the external message id.
 */
async function processIntelliInstagramEvent(
  supabase: SupabaseClient,
  body: IntelliWebhookPayload
) {
  if (body.event !== "message.received") return;

  const clientRef = body.client_ref;
  if (!clientRef) return;

  const messages = body.messages;
  if (!messages || messages.length === 0) return;

  const { data: channel } = await supabase
    .from("channels")
    .select("id, organization_id")
    .eq("platform", "instagram")
    .eq("is_active", true)
    .eq("credentials->>client_ref", clientRef)
    .maybeSingle();

  if (!channel) return;

  for (const msg of messages) {
    // sender.id is the IGSID — the only handle Meta gives us to reply with.
    const igsid = msg.sender?.id;
    if (!igsid) continue;

    const name = msg.sender?.username || igsid;

    let content =
      typeof msg.text === "string" ? msg.text : msg.text?.body || "";
    const attachments: MessageAttachment[] = [];
    for (const att of msg.attachments || []) {
      attachments.push({ type: att.type || "file" });
      if (!content) content = `[${att.type === "image" ? "Image" : att.type === "video" ? "Vidéo" : att.type || "Pièce jointe"}]`;
    }
    if (!content) content = msg.type ? `[${msg.type}]` : "";

    const customerId = await findOrCreateCustomer(
      supabase,
      channel.organization_id,
      { instagramId: igsid },
      name
    );

    // external_thread_id = IGSID so replies can pass it straight back to
    // /messages/send as `to`.
    const { conversationId } = await findOrCreateConversation(
      supabase,
      channel.organization_id,
      customerId,
      channel.id,
      igsid
    );

    if (msg.id) {
      const { data: dupe } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("external_message_id", msg.id)
        .maybeSingle();
      if (dupe) continue;
    }

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
