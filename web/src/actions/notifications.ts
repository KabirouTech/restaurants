"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function saveTokenAction(token: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Non authentifié" };

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ fcm_token: token })
    .eq("clerk_id", userId);

  if (error) return { error: error.message };
  return { success: true };
}
