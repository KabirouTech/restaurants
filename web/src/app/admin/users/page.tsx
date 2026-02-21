import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; role?: string }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_super_admin) redirect("/dashboard");

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: users } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, role, organization_id, avatar_url, created_at, is_super_admin")
        .order("created_at", { ascending: false });

    const { data: organizations } = await supabaseAdmin
        .from("organizations")
        .select("id, name");

    let filtered = users || [];
    if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(u =>
            u.full_name?.toLowerCase().includes(s)
        );
    }
    if (params.role && params.role !== "all") {
        filtered = filtered.filter(u => u.role === params.role);
    }

    return (
        <UsersClient
            users={filtered}
            organizations={organizations || []}
        />
    );
}
