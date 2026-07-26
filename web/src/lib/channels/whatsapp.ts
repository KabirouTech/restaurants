import type { OutgoingMedia } from "./index";

/**
 * WhatsApp goes through the Intelli Partner relay, and only through it.
 *
 * The direct Cloud API path was removed: it required us to hold each client's
 * Meta token, and inbound traffic no longer reaches us that way — Intelli
 * verifies, normalizes and forwards every event to /api/webhooks/intelli. The
 * raw Meta webhook processor that used to live here went with it.
 */

export async function sendWhatsAppMessage(
  credentials: any,
  recipientPhone: string,
  content: string,
  attachments: OutgoingMedia[] = []
): Promise<{ externalMessageId?: string; error?: string; warnings?: string[] }> {
  const clientRef = credentials?.client_ref;

  if (!clientRef) {
    return {
      error:
        "Ce canal WhatsApp n'est pas relié à Intelli. Reconnectez-le depuis Réglages → Canaux.",
    };
  }

  const media = attachments[0];
  const { intelliSendMessage } = await import("@/lib/intelli/partner-client");

  try {
    const result = await intelliSendMessage({
      clientRef,
      to: recipientPhone,
      text: content,
      media: media
        ? { type: media.type, url: media.url, filename: media.filename }
        : undefined,
    });
    return {
      externalMessageId: result.message_id ?? undefined,
      warnings: result.warnings,
    };
  } catch (err: any) {
    if (err?.code === "media_link_required") {
      return {
        error:
          "WhatsApp télécharge le fichier lui-même : la pièce jointe doit être une URL HTTPS publique.",
      };
    }
    return { error: err?.message || "Intelli send error" };
  }
}
