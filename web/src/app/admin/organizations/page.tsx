import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { OrganizationsClient } from "./OrganizationsClient";

export default async function AdminOrganizationsPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; plan?: string; status?: string }>;
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

    // Fetch all orgs
    const { data: orgs } = await supabaseAdmin
        .from("organizations")
        .select("id, name, slug, subscription_plan, is_active, created_at")
        .order("created_at", { ascending: false });

    // Fetch order counts per org
    const { data: orderCounts } = await supabaseAdmin
        .from("orders")
        .select("organization_id");

    const orderCountMap: Record<string, number> = {};
    (orderCounts || []).forEach(o => {
        orderCountMap[o.organization_id] = (orderCountMap[o.organization_id] || 0) + 1;
    });

    // Server-side filters
    let filtered = orgs || [];
    if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(o =>
            o.name?.toLowerCase().includes(s) || o.slug?.toLowerCase().includes(s)
        );
    }
    if (params.plan && params.plan !== "all") {
        filtered = filtered.filter(o => (o.subscription_plan || "free") === params.plan);
    }
    if (params.status === "active") {
        filtered = filtered.filter(o => o.is_active !== false);
    } else if (params.status === "inactive") {
        filtered = filtered.filter(o => o.is_active === false);
    }

    return (
        <OrganizationsClient
            organizations={filtered}
            orderCountMap={orderCountMap}
            initialSearch={params.search}
            initialPlan={params.plan}
            initialStatus={params.status}
        />
    );
}
