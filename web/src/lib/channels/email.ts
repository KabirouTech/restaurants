import { ImapFlow } from "imapflow";
import * as nodemailer from "nodemailer";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  findOrCreateCustomer,
  findOrCreateConversation,
  insertIncomingMessage,
} from "./conversation-helpers";

export async function pollEmailChannel(
  supabase: SupabaseClient,
  channel: any
) {
  const { imap_host, imap_port, imap_user, imap_pass, imap_tls } =
    channel.credentials;

  const client = new ImapFlow({
    host: imap_host,
    port: imap_port || 993,
    secure: imap_tls !== false,
    auth: { user: imap_user, pass: imap_pass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const messages = client.fetch({ seen: false }, {
        envelope: true,
        source: true,
        uid: true,
      });

      for await (const msg of messages) {
        const envelope = msg.envelope;
        if (!envelope) continue;
        const from = envelope.from?.[0];
        if (!from) continue;

        const senderEmail = from.address || "";
        const senderName = from.name || senderEmail;
        const subject = envelope.subject || "(pas de sujet)";
        const messageId = envelope.messageId || `uid-${msg.uid}`;
        const inReplyTo = envelope.inReplyTo;

        // Extract text content
        let content = `Sujet: ${subject}\n\n`;
        if (msg.source) {
          const sourceStr = msg.source.toString();
          const textMatch = sourceStr.match(
            /Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\.\r\n|$)/i
          );
          if (textMatch) {
            content += textMatch[1].trim();
          } else {
            const htmlMatch = sourceStr.match(
              /Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\.\r\n|$)/i
            );
            if (htmlMatch) {
              content += htmlMatch[1].replace(/<[^>]+>/g, "").trim();
            }
          }
        }

        const customerId = await findOrCreateCustomer(
          supabase,
          channel.organization_id,
          { email: senderEmail },
          senderName
        );

        // Thread grouping: use In-Reply-To or Message-ID
        const threadId = inReplyTo || messageId;

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
          messageId
        );

        // Mark as seen
        await client.messageFlagsAdd({ uid: msg.uid }, ["\\Seen"], {
          uid: true,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

export async function sendEmailReply(
  credentials: any,
  recipientEmail: string,
  content: string,
  threadId?: string
): Promise<{ externalMessageId?: string; error?: string }> {
  const {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_pass,
    smtp_tls,
    from_name,
    from_email,
  } = credentials;

  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port || 587,
      secure: smtp_tls === true,
      auth: { user: smtp_user, pass: smtp_pass },
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: from_name
        ? `"${from_name}" <${from_email || smtp_user}>`
        : from_email || smtp_user,
      to: recipientEmail,
      text: content,
    };

    if (threadId) {
      mailOptions.inReplyTo = threadId;
      mailOptions.references = threadId;
    }

    const info = await transporter.sendMail(mailOptions);
    return { externalMessageId: info.messageId };
  } catch (err: any) {
    return { error: err.message || "SMTP error" };
  }
}
