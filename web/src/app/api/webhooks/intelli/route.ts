import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verifyIntelliSignature } from "@/lib/intelli/partner-client";
import {
  processIntelliWebhook,
  type IntelliWebhookPayload,
} from "@/lib/intelli/webhook";

// POST: receive normalized, HMAC-signed events from Intelli (WhatsApp and
// Instagram messages forwarded by the Partner platform, dispatched on the
// payload's `channel` field). Configure this URL as the partner webhook_url in
// the Intelli portal (Webhooks section).
export async function POST(request: NextRequest) {
  // Read the raw body for signature verification — must hash exactly what was
  // sent, before any JSON re-serialization.
  const rawBody = await request.text();
  const signature = request.headers.get("x-intelli-signature");

  if (!verifyIntelliSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: IntelliWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  await supabase.from("webhook_events").insert({
    provider: "intelli",
    payload: body,
    status: "pending",
  });

  try {
    await processIntelliWebhook(supabase, body);
  } catch (err) {
    console.error("Intelli webhook error:", err);
  }

  // Always 200 so Intelli doesn't retry/back off on our processing errors.
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
