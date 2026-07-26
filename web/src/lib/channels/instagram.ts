import type { OutgoingMedia } from "./index";

/**
 * Instagram goes through the Intelli Partner relay, and only through it.
 *
 * The direct Graph path was removed: it required our own Meta app credentials
 * per client, and inbound traffic no longer reaches us that way — Intelli
 * verifies, normalizes and forwards every event to /api/webhooks/intelli. The
 * raw Meta webhook processor that used to live here went with it.
 */

export async function sendInstagramMessage(
  credentials: any,
  recipientId: string,
  content: string,
  attachments: OutgoingMedia[] = []
): Promise<{ externalMessageId?: string; error?: string; warnings?: string[] }> {
  const clientRef = credentials?.client_ref;

  if (!clientRef) {
    return {
      error:
        "Ce canal Instagram n'est pas relié à Intelli. Reconnectez-le depuis Réglages → Canaux.",
    };
  }

  const media = attachments[0];
  const { intelliSendMessage, INSTAGRAM_TEXT_LIMIT, IntelliAPIError } =
    await import("@/lib/intelli/partner-client");

  if (content.length > INSTAGRAM_TEXT_LIMIT) {
    return {
      error: `Message trop long pour Instagram (${content.length}/${INSTAGRAM_TEXT_LIMIT} caractères).`,
    };
  }

  // recipientId must be the IGSID from an inbound webhook (sender.id); Meta
  // only accepts replies within 24h of the customer's last message.
  try {
    if (!media) {
      const result = await intelliSendMessage({
        clientRef,
        to: recipientId,
        text: content,
      });
      return {
        externalMessageId: result.message_id ?? undefined,
        warnings: result.warnings,
      };
    }

    // An Instagram attachment has no caption slot. Rather than let the text be
    // dropped (the relay would succeed and only say so in `warnings`), send the
    // media first and the caption as its own message — the remedy the relay
    // itself prescribes.
    const mediaResult = await intelliSendMessage({
      clientRef,
      to: recipientId,
      text: "",
      media: { type: media.type, url: media.url, filename: media.filename },
      allowCaption: false,
    });

    const warnings = [...(mediaResult.warnings ?? [])];

    if (content) {
      try {
        const captionResult = await intelliSendMessage({
          clientRef,
          to: recipientId,
          text: content,
        });
        warnings.push(...(captionResult.warnings ?? []));
      } catch (err) {
        // The media did land; report the caption failure without pretending
        // the whole send failed.
        warnings.push(
          `La pièce jointe est partie mais la légende n'a pas pu être envoyée : ${
            err instanceof Error ? err.message : "erreur inconnue"
          }`
        );
      }
    }

    return {
      externalMessageId: mediaResult.message_id ?? undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (err) {
    if (err instanceof IntelliAPIError && err.status === 429) {
      return { error: "Limite d'envoi atteinte. Réessayez dans un instant." };
    }
    if (err instanceof IntelliAPIError && err.code === "media_link_required") {
      return {
        error:
          "Instagram télécharge le fichier lui-même : la pièce jointe doit être une URL HTTPS publique.",
      };
    }
    return {
      error: err instanceof Error ? err.message : "Intelli send error",
    };
  }
}
