import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { CapacityMeter } from "@/components/dashboard/CapacityMeter";
import { RecentOrders } from "@/components/dashboard/RecentOrders";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ChefHat, CalendarDays, MessageSquare, Utensils, FileText, PlusCircle } from "lucide-react";
import Link from "next/link";

import { createClient as createAdminClient } from "@supabase/supabase-js";

export default async function DashboardPage() {
  const supabase = await createClient(); // Standard client for auth
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch Profile & Organization (User Context)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(name, slug, subscription_plan)")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    redirect("/dashboard/onboarding");
  }

  const orgId = profile.organization_id;
  // @ts-ignore
  const orgName = profile.organizations?.name || "Votre Restaurant";

  // --- Secure Data Fetching (Service Role) ---
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 1. Fetch Orders Stats
  const { count: orderCount, data: revenueData } = await supabaseAdmin
    .from("orders")
    .select("total_amount_cents", { count: "exact" })
    .eq("organization_id", orgId);

  const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total_amount_cents || 0), 0) || 0;

  // 2. Fetch Recent Orders
  const { data: recentOrders } = await supabaseAdmin
    .from("orders")
    .select("*, customers(full_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(5);

  // 3. Fetch Capacity Types (Public/User readable usually, but let's be safe)
  const { data: capacityTypes } = await supabaseAdmin
    .from("capacity_types")
    .select("id, name, load_cost")
    .eq("organization_id", orgId);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 md:p-8 lg:p-10">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-border pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary font-serif italic">
            <ChefHat className="h-5 w-5" />
            <span className="text-sm font-medium">Restaurant OS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-secondary font-serif">
            Bonjour, {profile.full_name?.split(' ')[0] || "Chef"}.
          </h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{orgName}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">


          <Link href="/dashboard/orders/new">
            <Button className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-medium gap-2">
              <PlusCircle className="h-4 w-4" /> Nouveau Devis
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Stats Row */}
        <div className="md:col-span-3">
          <OverviewStats
            organizationId={orgId}
            totalRevenueCents={totalRevenue}
            orderCount={orderCount || 0}
          />
        </div>

        {/* Left Column: Big Widgets */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <CapacityMeter organizationId={orgId} />
            <RecentOrders
              organizationId={orgId}
              orders={recentOrders || []}
            />
          </div>

          {/* Inbox Preview Link */}
          <div className="p-8 rounded-2xl border border-dashed border-border bg-muted/20 min-h-[200px] flex flex-col justify-center items-center text-center">
            <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center mb-4 text-primary shadow-sm">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-secondary font-serif mb-1">Inbox Unifiée</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs leading-relaxed">
              Centralisez vos messages WhatsApp et Instagram pour ne rater aucune commande.
            </p>
            <Link href="/dashboard/inbox">
              <Button variant="link" className="text-primary font-medium hover:underline underline-offset-4">Connecter mes comptes &rarr;</Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Quick Actions / Notifications */}
        <aside className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-white shadow-sm">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">À Faire (Urgent)</h3>
            <ul className="space-y-4">
              {[
                "Confirmer menu Mariage",
                "Envoyer facture #3024",
                "Rappeler fournisseur Poisson"
              ].map((task, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <div className="mt-1 h-5 w-5 rounded-md border border-input bg-background group-hover:border-primary transition-colors cursor-pointer flex items-center justify-center text-primary opacity-0 group-hover:opacity-100">
                    <div className="h-2.5 w-2.5 bg-primary rounded-sm"></div>
                  </div>
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors cursor-pointer font-medium">{task}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 rounded-2xl bg-secondary text-white relative overflow-hidden group shadow-xl shadow-secondary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

            <h3 className="text-xl font-bold font-serif mb-2 relative z-10">Passez en Pro</h3>
            <p className="text-sm text-white/80 mb-6 relative z-10 leading-relaxed">Débloquez l'accès illimité, le multi-utilisateurs et les statistiques avancées.</p>
            <Button className="w-full bg-white text-secondary hover:bg-white/90 border-none font-bold shadow-lg">
              Voir les offres
            </Button>
          </div>
        </aside>

      </main>
    </div>
  );
}
