import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, ArrowLeft, FileText, Users, DollarSign } from "lucide-react";
import Link from "next/link";
import { OrgActions } from "@/components/admin/OrgActions";

export default async function AdminOrgDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
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

    const [
        { data: org },
        { data: orders },
        { count: customerCount },
    ] = await Promise.all([
        supabaseAdmin
            .from("organizations")
            .select("*")
            .eq("id", id)
            .single(),
        supabaseAdmin
            .from("orders")
            .select("total_amount_cents, status")
            .eq("organization_id", id),
        supabaseAdmin
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", id),
    ]);

    if (!org) redirect("/admin/organizations");

    const REVENUE_STATUSES = ['confirmed', 'in_progress', 'completed', 'delivered', 'preparing'];
    const totalRevenue = (orders || [])
        .filter(o => REVENUE_STATUSES.includes(o.status))
        .reduce((acc, curr) => acc + (curr.total_amount_cents || 0), 0);

    const totalOrders = orders?.length || 0;

    const formatRevenue = (cents: number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
    };

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
                <div className="flex items-center gap-4">
                    <Link href="/admin/organizations" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                            {org.name}
                        </h1>
                        <p className="text-sm text-muted-foreground font-light font-mono">/{org.slug}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${planBadge(org.subscription_plan || "free")}`}>
                        {org.subscription_plan || "free"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${org.is_active !== false
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                        {org.is_active !== false ? "Actif" : "Inactif"}
                    </span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Commandes</p>
                            <h3 className="text-2xl font-bold text-foreground font-serif">{totalOrders}</h3>
                        </div>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Clients</p>
                            <h3 className="text-2xl font-bold text-foreground font-serif">{customerCount || 0}</h3>
                        </div>
                    </div>
                    <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenu Total</p>
                            <h3 className="text-2xl font-bold text-foreground font-serif">{formatRevenue(totalRevenue)}</h3>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-8">
                    <h2 className="text-lg font-bold text-foreground font-serif mb-4">Actions</h2>
                    <OrgActions
                        orgId={org.id}
                        isActive={org.is_active !== false}
                        currentPlan={org.subscription_plan || "free"}
                    />
                </div>

                {/* Settings JSON */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                    <h2 className="text-lg font-bold text-foreground font-serif mb-4">Settings (lecture seule)</h2>
                    <pre className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground overflow-x-auto font-mono">
                        {JSON.stringify(org.settings || {}, null, 2)}
                    </pre>
                </div>

                {/* Info */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 mt-6">
                    <h2 className="text-lg font-bold text-foreground font-serif mb-4">Informations</h2>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-muted-foreground">ID</dt>
                            <dd className="font-mono text-xs text-foreground">{org.id}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Créé le</dt>
                            <dd className="text-foreground">
                                {org.created_at ? format(new Date(org.created_at), "d MMMM yyyy", { locale: fr }) : "-"}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
