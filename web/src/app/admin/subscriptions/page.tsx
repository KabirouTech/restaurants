import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown, Users, Zap, Building2, CalendarDays, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PLAN_META: Record<string, { label: string; color: string; bg: string }> = {
    free:       { label: "Gratuit",    color: "text-slate-700",  bg: "bg-slate-100" },
    premium:    { label: "Premium",    color: "text-amber-700",  bg: "bg-amber-100" },
    enterprise: { label: "Sur Mesure", color: "text-violet-700", bg: "bg-violet-100" },
};

export default async function AdminSubscriptionsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_super_admin) redirect("/dashboard");

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Récupérer tous les abonnements avec l'org
    const { data: subs } = await admin
        .from("subscriptions")
        .select(`
            *,
            organizations ( id, name, slug, is_active )
        `)
        .order("created_at", { ascending: false });

    const all = subs || [];

    const freeSubs      = all.filter(s => s.plan_key === "free").length;
    const premiumSubs   = all.filter(s => s.plan_key === "premium").length;
    const enterpriseSubs = all.filter(s => s.plan_key === "enterprise").length;
    const activeSubs    = all.filter(s => s.status === "active").length;

    // MRR (premium * 60 000 FCFA)
    const mrr = premiumSubs * 60000;

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center px-4 md:px-8 shrink-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold font-serif flex items-center gap-2">
                        <Crown className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                        Abonnements
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">{all.length} organisations · {premiumSubs} Premium</p>
                </div>
            </header>

            <div className="p-4 md:p-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <StatCard icon={<Users className="h-5 w-5" />} color="bg-slate-500/10 text-slate-600" label="Gratuit" value={freeSubs} sub={`${all.length > 0 ? Math.round(freeSubs / all.length * 100) : 0}% des orgs`} />
                    <StatCard icon={<Crown className="h-5 w-5" />} color="bg-amber-500/10 text-amber-600" label="Premium" value={premiumSubs} sub="60 000 FCFA/mois" />
                    <StatCard icon={<Building2 className="h-5 w-5" />} color="bg-violet-500/10 text-violet-600" label="Sur Mesure" value={enterpriseSubs} sub="Tarif personnalisé" />
                    <StatCard icon={<TrendingUp className="h-5 w-5" />} color="bg-green-500/10 text-green-600" label="MRR" value={`${mrr.toLocaleString("fr-FR")} FCFA`} sub={`${premiumSubs} abonnés actifs`} />
                </div>

                {/* Table Header */}
                <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="p-4 md:p-5 border-b border-border bg-muted/30 flex items-center justify-between">
                        <h2 className="font-semibold text-sm">Tous les abonnements</h2>
                        <span className="text-xs text-muted-foreground">{activeSubs} actifs</span>
                    </div>

                    {/* ── MOBILE: Card layout ──────────────────────── */}
                    <div className="md:hidden divide-y divide-border">
                        {all.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">Aucun abonnement</div>
                        ) : all.map((sub) => {
                            const org = sub.organizations as any;
                            const meta = PLAN_META[sub.plan_key] ?? PLAN_META.free;
                            const statusColor = sub.status === "active"
                                ? "bg-green-100 text-green-700"
                                : sub.status === "past_due"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600";

                            return (
                                <Link key={sub.id} href={`/admin/organizations/${org?.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs shrink-0">
                                        {org?.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{org?.name || "—"}</p>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
                                                {sub.plan_key === "premium" && <Crown className="h-2.5 w-2.5" />}
                                                {meta.label}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor}`}>
                                                {sub.status}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {sub.created_at ? new Date(sub.created_at).toLocaleDateString("fr-FR") : "—"}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* ── DESKTOP: Table layout ─────────────────────── */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/20">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organisation</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cycle</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Période en cours</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inscrit le</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {all.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Aucun abonnement</td></tr>
                                ) : all.map((sub) => {
                                    const org = sub.organizations as any;
                                    const meta = PLAN_META[sub.plan_key] ?? PLAN_META.free;
                                    const statusColor = sub.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : sub.status === "past_due"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-slate-100 text-slate-600";

                                    return (
                                        <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={`/admin/organizations/${org?.id}`} className="flex items-center gap-2 group">
                                                    <div className="w-7 h-7 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {org?.name?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate group-hover:text-orange-500 transition-colors">{org?.name || "—"}</p>
                                                        <p className="text-xs text-muted-foreground">/{org?.slug}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                                                    {sub.plan_key === "premium" && <Crown className="h-3 w-3" />}
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{sub.billing_cycle || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {sub.current_period_start
                                                        ? new Date(sub.current_period_start).toLocaleDateString("fr-FR")
                                                        : "—"}
                                                    {sub.current_period_end && (
                                                        <> → {new Date(sub.current_period_end).toLocaleDateString("fr-FR")}</>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {sub.created_at
                                                    ? new Date(sub.created_at).toLocaleDateString("fr-FR")
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, color, label, value, sub }: {
    icon: React.ReactNode;
    color: string;
    label: string;
    value: string | number;
    sub: string;
}) {
    return (
        <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold font-serif">{value}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
            </div>
        </div>
    );
}
