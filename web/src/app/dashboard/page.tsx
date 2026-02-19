import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Ban,
  Plus,
  DollarSign,
  FileText,
  Truck,
  Star,
  BarChart,
  Receipt,
  MoreVertical,
  MessageSquare,
  Camera,
  Mail,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";

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
    .select("total_amount_cents, status", { count: "exact" })
    .eq("organization_id", orgId);

  const totalRevenue = revenueData?.reduce((acc, curr) => acc + (curr.total_amount_cents || 0), 0) || 0;
  const pendingQuotesCount = revenueData?.filter(o => o.status === 'draft' || o.status === 'pending').length || 0;

  // 2. Fetch Recent Orders
  const { data: recentOrders } = await supabaseAdmin
    .from("orders")
    .select("*, customers(full_name)")
    .eq("organization_id", orgId)
    .order("event_date", { ascending: true }) // Upcoming orders
    .gte("event_date", format(new Date(), "yyyy-MM-dd"))
    .limit(5);

  // Mock Data for UI elements not yet fully backend-supported
  const deliveryCount = 4; // Mocked
  const averageRating = 4.9; // Mocked

  // Mock Dates for Capacity
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const capacityDays = Array.from({ length: 6 }).map((_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      dayName: format(date, "EEE, d", { locale: fr }),
      percent: [25, 45, 15, 80, 100, 95][i], // Mocked percentages from Stitch
      isFull: [false, false, false, false, true, false][i]
    };
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Header */}
      <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground font-light">Bonjour, voici le programme culinaire du jour.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-10 pr-4 py-2.5 rounded-full bg-background border border-border focus:ring-1 focus:ring-primary text-sm w-64 shadow-sm"
              placeholder="Rechercher commandes, clients..."
              type="text"
            />
          </div>
          <Button variant="outline" className="hidden sm:flex items-center gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/5 font-medium text-sm h-10 px-5">
            <Ban className="h-4 w-4" />
            Fermer une date
          </Button>
          <Link href="/dashboard/orders/new">
            <Button className="flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md shadow-primary/20 transition-all transform hover:scale-105 h-10 px-5">
              <Plus className="h-4 w-4" />
              Créer un devis
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenu Mensuel</p>
              <h3 className="text-2xl font-bold text-foreground font-serif">{(totalRevenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
            </div>
          </div>

          {/* Pending Quotes */}
          <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Devis en Attente</p>
              <h3 className="text-2xl font-bold text-foreground font-serif">{pendingQuotesCount}</h3>
            </div>
          </div>

          {/* Today's Deliveries */}
          <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Livraisons du Jour</p>
              <h3 className="text-2xl font-bold text-foreground font-serif">{deliveryCount}</h3>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Note Moyenne</p>
              <h3 className="text-2xl font-bold text-foreground font-serif">{averageRating}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Capacity Overview */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 font-serif">
                  <BarChart className="text-primary h-5 w-5" />
                  Aperçu de la Capacité
                </h2>
                <div className="flex items-center text-sm text-muted-foreground font-medium hover:text-primary cursor-pointer transition-colors">
                  Cette Semaine <ChevronDown className="h-4 w-4 ml-1" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  {capacityDays.map((day, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 items-center group">
                      <div className="col-span-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                        {day.dayName}
                      </div>
                      <div className="col-span-9 relative h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${day.isFull ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${day.percent}%`, opacity: day.isFull ? 1 : 0.4 + (day.percent / 200) }}
                        ></div>
                      </div>
                      <div className={`col-span-1 text-xs text-right font-medium ${day.isFull ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                        {day.isFull ? 'PLEIN' : `${day.percent}%`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 font-serif">
                  <Receipt className="text-primary h-5 w-5" />
                  Commandes à venir
                </h2>
                <Link href="/dashboard/orders" className="text-sm text-primary hover:text-primary/80 font-medium border-b border-transparent hover:border-primary transition-all">
                  Voir tout
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border bg-muted/50">
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider font-serif text-foreground">Client</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider font-serif text-foreground">Événement</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider font-serif text-foreground">Date & Heure</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider font-serif text-foreground">Couverts</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider font-serif text-foreground">Statut</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {recentOrders && recentOrders.length > 0 ? (
                      recentOrders.map((order) => {
                        const initials = order.customers?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "C";
                        const statusStyles =
                          order.status === 'confirmed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            order.status === 'draft' ? "bg-orange-100 text-orange-700 border-orange-200" :
                              "bg-yellow-100 text-yellow-700 border-yellow-200";
                        const statusLabel =
                          order.status === 'confirmed' ? "Confirmé" :
                            order.status === 'draft' ? "Brouillon" : "En attente";

                        return (
                          <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                                  {initials}
                                </div>
                                <span className="font-bold text-foreground font-serif">{order.customers?.full_name || "Client Inconnu"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{order.internal_notes || "Commande"}</td>
                            <td className="px-6 py-4 text-muted-foreground capitalize">
                              {order.event_date ? format(new Date(order.event_date), "EEE, d MMM", { locale: fr }) : "-"} • {order.event_time?.slice(0, 5) || "12:00"}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{order.guest_count || 0} pers.</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Aucune commande à venir.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (1/3) */}
          <div className="lg:col-span-1 space-y-6">

            {/* Messages Widget */}
            <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-[500px]">
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 font-serif">
                  <MessageSquare className="text-primary h-5 w-5" />
                  Messages récents
                </h2>
                <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">3 Nouv.</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Message 1 */}
                <div className="p-4 bg-card hover:bg-muted/50 border border-border/50 hover:border-primary/20 rounded-xl cursor-pointer transition-all shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                        <MessageSquare className="text-[#25D366] h-3 w-3" />
                      </div>
                      <span className="text-sm font-bold text-foreground font-serif">Sarah Jenkins</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">il y a 2m</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-9 group-hover:text-foreground transition-colors">Bonjour ! Je voulais savoir si vous avez de la disponibilité pour une baby shower le 24 ?</p>
                </div>

                {/* Message 2 */}
                <div className="p-4 bg-muted/30 border border-border rounded-xl cursor-pointer transition-all shadow-sm group relative">
                  <div className="absolute right-2 top-2 w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[1.5px]">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                          <Camera className="text-black h-3 w-3" />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-foreground font-serif">@foodie_mike</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">il y a 1h</span>
                  </div>
                  <p className="text-xs text-foreground font-medium line-clamp-2 pl-9">Votre dernier post a l'air incroyable ! Faites-vous des services traiteur pour de petits dîners privés ?</p>
                </div>

                {/* Message 3 */}
                <div className="p-4 bg-card hover:bg-muted/50 border border-border/50 hover:border-primary/20 rounded-xl cursor-pointer transition-all shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Mail className="text-blue-500 h-3 w-3" />
                      </div>
                      <span className="text-sm font-bold text-foreground font-serif">Équipe Événementielle</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">il y a 3h</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-9 group-hover:text-foreground transition-colors">RE: Devis #4092 - Nous souhaitons procéder avec l'Option B mais devons changer le nombre de végétariens.</p>
                </div>
              </div>
              <div className="p-4 border-t border-border bg-gray-50/50">
                <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-primary font-medium">Aller à la Messagerie</Button>
              </div>
            </div>

            {/* Promo Card */}
            <div className="relative rounded-xl overflow-hidden h-40 group shadow-md border border-border">
              {/* Placeholder Image because we can't fetch external images reliably in all envs without config. Using a colored gradient as fallback or a safe internal image would be better, but sticking to requested design concept with CSS gradient for now if image fails, or just the gradient overlay. */}
              <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply transition-colors"></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Promo background"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 -z-10"
                src="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2070&auto=format&fit=crop"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/40 to-transparent p-6 flex flex-col justify-end">
                <h3 className="text-white font-serif font-bold text-xl mb-1">Menu de Saison</h3>
                <p className="text-xs text-gray-200 mb-3 font-medium">Il est temps de mettre à jour vos offres pour l'Automne ?</p>
                <button className="w-fit px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/40 transition-colors">Mettre à jour le Menu</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

