import { sendWhatsAppMessage } from "./whatsapp";
import { sendInstagramMessage } from "./instagram";
import { sendEmailReply } from "./email";

interface SendResult {
  externalMessageId?: string;
  error?: string;
}

export async function sendExternalMessage(
  platform: string,
  credentials: any,
  recipientId: string,
  content: string,
  threadId?: string
): Promise<SendResult> {
  switch (platform) {
    case "whatsapp":
      return sendWhatsAppMessage(credentials, recipientId, content);
    case "instagram":
      return sendInstagramMessage(credentials, recipientId, content);
    case "email":
      return sendEmailReply(credentials, recipientId, content, threadId);
    default:
      return { error: `Unsupported platform: ${platform}` };
  }
}
