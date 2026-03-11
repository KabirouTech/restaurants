import { currentUser } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * Ensures the current Clerk user is linked to a Supabase profile.
 *
 * If a profile with clerk_id exists, returns it.
 * If not, looks up the Clerk user's email, finds a matching profile
 * via Supabase auth.users, and sets clerk_id on it.
 *
 * Returns the profile or null if no match found (new user needs onboarding).
 */
export async function syncClerkProfile(clerkUserId: string) {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // 1. Check if profile already linked
    const { data: existing, error: existingErr } = await supabase
        .from("profiles")
        .select("*, organizations(name, slug, subscription_plan)")
        .eq("clerk_id", clerkUserId)
        .limit(1)
        .maybeSingle();

    if (existing) return existing;

    if (existingErr) {
        console.warn("[clerk-sync] Profile lookup error for clerk_id:", clerkUserId, existingErr.message);
    } else {
        console.log("[clerk-sync] No profile found for clerk_id:", clerkUserId);
    }

    // 2. Get Clerk user's email
    const clerkUser = await currentUser();
    if (!clerkUser) {
        console.log("[clerk-sync] No Clerk user found");
        return null;
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    console.log("[clerk-sync] Clerk user email:", email);
    if (!email) return null;

    // 3. Find matching Supabase auth user by email
    const { data: authUsers, error: authUsersErr } = await supabase.auth.admin.listUsers();
    if (authUsersErr) {
        console.warn("[clerk-sync] Unable to list Supabase auth users:", authUsersErr.message);
        return null;
    }

    const matchingAuthUser = authUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    console.log("[clerk-sync] Matching auth user:", matchingAuthUser?.id, matchingAuthUser?.email);

    if (!matchingAuthUser) {
        // No old Supabase auth user — check if there's a profile without clerk_id
        // (e.g., created during this session's onboarding)
        console.log("[clerk-sync] No matching auth user, checking profiles without clerk_id...");
        return null;
    }

    // 4. Find profile with the old Supabase auth user ID
    const { data: oldProfile, error: oldProfileErr } = await supabase
        .from("profiles")
        .select("*, organizations(name, slug, subscription_plan)")
        .eq("id", matchingAuthUser.id)
        .limit(1)
        .maybeSingle();

    console.log("[clerk-sync] Old profile:", oldProfile?.id, oldProfile?.organization_id, oldProfileErr?.message);

    if (!oldProfile) return null;

    // 5. Link the profile to the Clerk user
    const { error: updateErr } = await supabase
        .from("profiles")
        .update({ clerk_id: clerkUserId })
        .eq("id", oldProfile.id);

    console.log("[clerk-sync] Linked profile", oldProfile.id, "to clerk_id", clerkUserId, updateErr?.message || "OK");

    return { ...oldProfile, clerk_id: clerkUserId };
}
