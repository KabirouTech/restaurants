import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Building2,
    FileText,
    DollarSign,
    TrendingUp,
    Shield,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
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

    const now = new Date();
    const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const thisMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");

    const [
        { data: allOrgs },
        { data: allOrders },
        { count: totalOrderCount },
    ] = await Promise.all([
        supabaseAdmin
            .from("organizations")
            .select("id, name, slug, subscription_plan, is_active, created_at")
            .order("created_at", { ascending: false }),
        supabaseAdmin
            .from("orders")
            .select("total_amount_cents, status"),
        supabaseAdmin
            .from("orders")
            .select("id", { count: "exact", head: true }),
    ]);

    const orgs = allOrgs || [];
    const activeOrgs = orgs.filter(o => o.is_active !== false).length;
    const inactiveOrgs = orgs.filter(o => o.is_active === false).length;
    const newOrgsThisMonth = orgs.filter(o => {
        if (!o.created_at) return false;
        const d = o.created_at.slice(0, 10);
        return d >= thisMonthStart && d <= thisMonthEnd;
    }).length;

    // Revenue from confirmed+ orders
    const REVENUE_STATUSES = ['confirmed', 'in_progress', 'completed', 'delivered', 'preparing'];
    const totalRevenue = (allOrders || [])
        .filter(o => REVENUE_STATUSES.includes(o.status))
        .reduce((acc, curr) => acc + (curr.total_amount_cents || 0), 0);

    // Growth: new orgs per month (last 6 months)
    const monthlyGrowth = Array.from({ length: 6 }).map((_, i) => {
        const monthDate = subMonths(now, 5 - i);
        const mStart = format(startOfMonth(monthDate), "yyyy-MM-dd");
        const mEnd = format(endOfMonth(monthDate), "yyyy-MM-dd");
        const count = orgs.filter(o => {
            if (!o.created_at) return false;
            const d = o.created_at.slice(0, 10);
            return d >= mStart && d <= mEnd;
        }).length;
        return {
            label: format(monthDate, "MMM yy", { locale: fr }),
            count,
        };
    });
    const maxGrowth = Math.max(...monthlyGrowth.map(m => m.count), 1);

    // Recent orgs (top 5)
    const recentOrgs = orgs.slice(0, 5);

    const formatRevenue = (cents: number) => {
        return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            {/* Header */}
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Shield className="h-7 w-7 text-orange-500" />
                        Panel Plateforme
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">Vue d&apos;ensemble de toutes les organisations</p>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Organizations */}
                    <Link href="/admin/organizations" className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all">
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Organisations</p>
                            <h3 className="text-2xl font-bold text-foreground font-serif">{orgs.length}</h3>
                            <p className="text-[10px] text-muted-foreground">{activeOrgs} actives · {inactiveOrgs} inactives</p>
                        </div>
                    </Link>

                    {/* Total Orders */}
                    <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Commandes</p>
                            <h3 className="text-2xl font-bold text-foreground font-serif">{totalOrderCount || 0}</h3>
                        </div>
                    </div>

                    {/* Total Revenue */}
                    <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenu Total</p>
                            <h3 className="text-2xl font-bold text-foreground font-serif">{formatRevenue(totalRevenue)}</h3>
                        </div>
                    </div>

                    {/* New This Month */}
                    <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nouveaux ce mois</p>
                            <h3 className="text-2xl font-bold text-foreground font-serif">{newOrgsThisMonth}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Growth Chart */}
                    <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/30">
                            <h2 className="text-lg font-bold text-foreground font-serif flex items-center gap-2">
                                <TrendingUp className="text-orange-500 h-5 w-5" />
                                Croissance des Organisations
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">Nouvelles organisations par mois (6 derniers mois)</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {monthlyGrowth.map((month, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-2 text-sm font-medium text-muted-foreground capitalize">
                                            {month.label}
                                        </div>
                                        <div className="col-span-9 relative h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 h-full rounded-full bg-orange-500 transition-all duration-500"
                                                style={{ width: `${(month.count / maxGrowth) * 100}%`, opacity: 0.4 + (month.count / maxGrowth) * 0.6 }}
                                            />
                                        </div>
                                        <div className="col-span-1 text-xs text-right font-medium text-muted-foreground">
                                            {month.count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Orgs */}
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border bg-muted/30 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-foreground font-serif flex items-center gap-2">
                                <Building2 className="text-orange-500 h-5 w-5" />
                                Orgs récentes
                            </h2>
                            <Link href="/admin/organizations" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                                Voir tout
                            </Link>
                        </div>
                        <div className="divide-y divide-border">
                            {recentOrgs.length > 0 ? recentOrgs.map((org) => (
                                <Link key={org.id} href={`/admin/organizations/${org.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                                        {org.name?.[0]?.toUpperCase() || "O"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate font-serif">{org.name}</p>
                                        <p className="text-xs text-muted-foreground">/{org.slug} · {org.subscription_plan || "free"}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${org.is_active !== false ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                        {org.is_active !== false ? "Actif" : "Inactif"}
                                    </span>
                                </Link>
                            )) : (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Aucune organisation
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
