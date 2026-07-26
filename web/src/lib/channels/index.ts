import { sendWhatsAppMessage } from "./whatsapp";
import { sendInstagramMessage } from "./instagram";
import { sendEmailReply } from "./email";

interface SendResult {
  externalMessageId?: string;
  error?: string;
}

/** Media the composer attached, already uploaded and publicly reachable. */
export interface OutgoingMedia {
  url: string;
  type: "image" | "document" | "audio" | "video";
  filename?: string;
  mime_type?: string;
}

export async function sendExternalMessage(
  platform: string,
  credentials: any,
  recipientId: string,
  content: string,
  threadId?: string,
  attachments: OutgoingMedia[] = []
): Promise<SendResult> {
  switch (platform) {
    case "whatsapp":
      return sendWhatsAppMessage(credentials, recipientId, content, attachments);
    case "instagram":
      return sendInstagramMessage(credentials, recipientId, content, attachments);
    case "email":
      return sendEmailReply(credentials, recipientId, content, threadId);
    default:
      return { error: `Unsupported platform: ${platform}` };
  }
}
