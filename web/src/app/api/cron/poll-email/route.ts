import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { pollEmailChannel } from "@/lib/channels/email";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel cron sends this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("platform", "email")
    .eq("is_active", true);

  if (!channels || channels.length === 0) {
    return NextResponse.json({ status: "no_channels" });
  }

  const results = await Promise.allSettled(
    channels.map((ch) => pollEmailChannel(supabase, ch))
  );

  const summary = results.map((r, i) => ({
    channel_id: channels[i].id,
    status: r.status,
    error:
      r.status === "rejected" ? (r as PromiseRejectedResult).reason?.message : undefined,
  }));

  return NextResponse.json({ status: "ok", results: summary });
}
