import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { syncClerkProfile } from "@/lib/clerk-sync";

export type CurrentProfile = {
    id: string;
    clerk_id: string | null;
    organization_id: string | null;
    role?: string | null;
    is_super_admin?: boolean | null;
    organizations?: {
        id: string;
        name?: string | null;
        slug?: string | null;
        subscription_plan?: string | null;
        settings?: Record<string, unknown> | null;
    } | null;
};

export async function getCurrentProfile() {
    const { userId } = await auth();
    if (!userId) {
        return { userId: null, profile: null as CurrentProfile | null };
    }

    const linkedProfile = await syncClerkProfile(userId);
    if (linkedProfile) {
        return { userId, profile: linkedProfile as CurrentProfile };
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*, organizations(*)")
        .eq("clerk_id", userId)
        .limit(1)
        .maybeSingle();

    return { userId, profile: (profile as CurrentProfile | null) ?? null };
}
