import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
    let query = supabaseAdmin
        .from("organizations")
        .select("id, name, slug, subscription_plan, is_active, created_at")
        .order("created_at", { ascending: false });

    const { data: orgs } = await query;

    // Fetch order counts per org
    const { data: orderCounts } = await supabaseAdmin
        .from("orders")
        .select("organization_id");

    const orderCountMap: Record<string, number> = {};
    (orderCounts || []).forEach(o => {
        orderCountMap[o.organization_id] = (orderCountMap[o.organization_id] || 0) + 1;
    });

    // Client-side filters
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

    const planBadge = (plan: string) => {
        switch (plan) {
            case "pro": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "enterprise": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Building2 className="h-7 w-7 text-orange-500" />
                        Organisations
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">{filtered.length} organisation{filtered.length > 1 ? "s" : ""}</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Filters */}
                <form className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            name="search"
                            type="text"
                            placeholder="Rechercher par nom ou slug..."
                            defaultValue={params.search || ""}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                    </div>
                    <select
                        name="plan"
                        defaultValue={params.plan || "all"}
                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="all">Tous les plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                    <select
                        name="status"
                        defaultValue={params.status || "all"}
                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                        Filtrer
                    </button>
                </form>

                {/* Table */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-muted-foreground border-b border-border bg-muted/50">
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Nom</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Slug</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Commandes</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Créé le</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.length > 0 ? filtered.map((org) => (
                                    <tr key={org.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/organizations/${org.id}`} className="font-bold text-foreground hover:text-orange-500 transition-colors font-serif">
                                                {org.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">/{org.slug}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${planBadge(org.subscription_plan || "free")}`}>
                                                {org.subscription_plan || "free"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${org.is_active !== false
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}>
                                                {org.is_active !== false ? "Actif" : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{orderCountMap[org.id] || 0}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {org.created_at ? format(new Date(org.created_at), "d MMM yyyy", { locale: fr }) : "-"}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            Aucune organisation trouvée.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
