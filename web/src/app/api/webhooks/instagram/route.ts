import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { processInstagramWebhook } from "@/lib/channels/instagram";

// GET: Meta webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Uses the same verify token as WhatsApp (both are Meta webhooks)
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST: Receive incoming Instagram messages
export async function POST(request: NextRequest) {
  const body = await request.json();

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  await supabase.from("webhook_events").insert({
    provider: "instagram",
    payload: body,
    status: "pending",
  });

  try {
    await processInstagramWebhook(supabase, body);
  } catch (err: any) {
    console.error("Instagram webhook error:", err);
  }

  // Always return 200 to Meta
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
