import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

type SendEmailPayload = {
  to?: string;
  subject?: string;
  html?: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SendEmailPayload;

  try {
    payload = (await req.json()) as SendEmailPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const to = payload.to?.trim();
  const subject = payload.subject?.trim();
  const html = payload.html?.trim();

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, html" },
      { status: 400 }
    );
  }

  try {
    await sendMail({ to, subject, html });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/send-email] failed:", error);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}
