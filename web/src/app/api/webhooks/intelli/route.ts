import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { verifyIntelliSignature } from "@/lib/intelli/partner-client";
import {
  processIntelliWebhook,
  type IntelliWebhookPayload,
} from "@/lib/intelli/webhook";
import {
  describeError,
  finalizeWebhook,
  recordRejectedWebhook,
  recordWebhook,
} from "@/lib/webhooks/recorder";

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// POST: receive normalized, HMAC-signed events from Intelli (WhatsApp and
// Instagram messages forwarded by the Partner platform, dispatched on the
// payload's `channel` field). Configure this URL as the partner webhook_url in
// the Intelli portal (Webhooks section).
export async function POST(request: NextRequest) {
  // Read the raw body for signature verification — must hash exactly what was
  // sent, before any JSON re-serialization.
  const rawBody = await request.text();
  const signature = request.headers.get("x-intelli-signature");

  // Refusals are logged too — a rotated INTELLI_WEBHOOK_SECRET otherwise shows
  // up as nothing at all on our side.
  if (!verifyIntelliSignature(rawBody, signature)) {
    await recordRejectedWebhook(
      adminClient(),
      "intelli",
      signature ? "Signature invalide (secret désynchronisé ?)" : "En-tête x-intelli-signature absent",
      rawBody
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: IntelliWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    await recordRejectedWebhook(adminClient(), "intelli", "Corps de requête JSON invalide", rawBody);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = adminClient();

  const eventId = await recordWebhook(supabase, "intelli", body);
  const startedAt = performance.now();

  try {
    const result = await processIntelliWebhook(supabase, body);
    await finalizeWebhook(supabase, eventId, startedAt, result);
  } catch (err) {
    console.error("Intelli webhook error:", err);
    await finalizeWebhook(supabase, eventId, startedAt, {
      status: "failed",
      reason: describeError(err),
    });
  }

  // Always 200 so Intelli doesn't retry/back off on our processing errors.
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
