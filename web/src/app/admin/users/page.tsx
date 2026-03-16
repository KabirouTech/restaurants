import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { UsersClient } from "./UsersClient";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; role?: string }>;
}) {
    const params = await searchParams;
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");
    if (!profile?.is_super_admin) redirect("/dashboard");

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const [{ data: users }, { data: organizations }] = await Promise.all([
        supabaseAdmin
            .from("profiles")
            .select("id, full_name, role, organization_id, avatar_url, created_at, is_super_admin")
            .order("created_at", { ascending: false }),
        supabaseAdmin
            .from("organizations")
            .select("id, name"),
    ]);

    // Fetch emails from auth.users
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap: Record<string, string> = {};
    if (authData?.users) {
        for (const u of authData.users) {
            if (u.email) emailMap[u.id] = u.email;
        }
    }

    let filtered = users || [];
    if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(u =>
            u.full_name?.toLowerCase().includes(s) || emailMap[u.id]?.toLowerCase().includes(s)
        );
    }
    if (params.role && params.role !== "all") {
        filtered = filtered.filter(u => u.role === params.role);
    }

    return (
        <UsersClient
            users={filtered}
            organizations={organizations || []}
            emailMap={emailMap}
        />
    );
}
