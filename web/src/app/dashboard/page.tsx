import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { format, addDays, addWeeks, subWeeks, startOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Ban,
  Plus,
  DollarSign,
  FileText,
  Truck,
  Users,
  BarChart,
  Receipt,
  MoreVertical,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/currencies";
import { CapacityFilter } from "@/components/dashboard/CapacityFilter";
import { RevenueFilter } from "@/components/dashboard/RevenueFilter";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ capacityRange?: string; revenueRange?: string }>;
}) {
  const params = await searchParams;
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

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // Revenue date range
  const revenueRange = params.revenueRange || "this-month";
  let revenueStart: string;
  let revenueEnd: string;
  if (revenueRange === "last-month") {
    const lastMonth = subMonths(today, 1);
    revenueStart = format(startOfMonth(lastMonth), "yyyy-MM-dd");
    revenueEnd = format(endOfMonth(lastMonth), "yyyy-MM-dd");
  } else if (revenueRange === "this-week") {
    const ws = startOfWeek(today, { weekStartsOn: 1 });
    revenueStart = format(ws, "yyyy-MM-dd");
    revenueEnd = format(addDays(ws, 6), "yyyy-MM-dd");
  } else {
    revenueStart = format(startOfMonth(today), "yyyy-MM-dd");
    revenueEnd = format(endOfMonth(today), "yyyy-MM-dd");
  }

  // Capacity date range
  const capacityRange = params.capacityRange || "this-week";
  let baseWeekStart: Date;
  if (capacityRange === "next-week") {
    baseWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
  } else if (capacityRange === "last-week") {
    baseWeekStart = subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
  } else {
    baseWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  }
  const weekDates = Array.from({ length: 6 }).map((_, i) => addDays(baseWeekStart, i));
  const weekStartStr = format(weekDates[0], "yyyy-MM-dd");
  const weekEndStr = format(weekDates[5], "yyyy-MM-dd");

  // Parallel data fetching
  const [
    { data: allOrders },
    { data: recentOrders },
    { count: customerCount },
    { data: defaultsCalendar },
    { data: dailyLoads },
    { data: calendarOverrides },
    { data: conversations },
    { data: org },
  ] = await Promise.all([
    // 1. All orders for stats (current month revenue + pending quotes + today's deliveries)
    supabaseAdmin
      .from("orders")
      .select("total_amount_cents, status, event_date")
      .eq("organization_id", orgId),
    // 2. Upcoming orders for the table
    supabaseAdmin
      .from("orders")
      .select("*, customers(full_name)")
      .eq("organization_id", orgId)
      .order("event_date", { ascending: true })
      .gte("event_date", todayStr)
      .limit(5),
    // 3. Total customers count
    supabaseAdmin
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    // 4. Calendar defaults (for capacity max per day of week)
    supabaseAdmin
      .from("defaults_calendar")
      .select("day_of_week, max_daily_load, is_open")
      .eq("organization_id", orgId),
    // 5. Daily load usage for this week (from the view)
    supabaseAdmin
      .from("daily_load_usage")
      .select("event_date, current_load")
      .eq("organization_id", orgId)
      .gte("event_date", weekStartStr)
      .lte("event_date", weekEndStr),
    // 6. Calendar overrides for this week
    supabaseAdmin
      .from("calendar_overrides")
      .select("date, override_max_load, is_blocked")
      .eq("organization_id", orgId)
      .gte("date", weekStartStr)
      .lte("date", weekEndStr),
    // 7. Recent conversations with last message
    supabaseAdmin
      .from("conversations")
      .select(`
        id, last_message_at, unread_count, status,
        customers (full_name),
        channels (platform),
        messages (content, sender_type, created_at)
      `)
      .eq("organization_id", orgId)
      .order("last_message_at", { ascending: false })
      .limit(3),
    // 8. Organization settings (for currency)
    supabaseAdmin
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single(),
  ]);

  const settings = (org?.settings as Record<string, any>) || {};
  const currency = settings.currency || "EUR";

  // Revenue: only count confirmed/completed orders (exclude drafts, quotes, pending, cancelled)
  const REVENUE_STATUSES = ['confirmed', 'in_progress', 'completed', 'delivered', 'preparing'];
  const monthlyRevenue = allOrders
    ?.filter(o => o.event_date >= revenueStart && o.event_date <= revenueEnd && REVENUE_STATUSES.includes(o.status))
    .reduce((acc, curr) => acc + (curr.total_amount_cents || 0), 0) || 0;

  // Pending quotes
  const pendingQuotesCount = allOrders?.filter(o => o.status === 'draft' || o.status === 'pending' || o.status === 'pending_approval').length || 0;

  // Today's deliveries/events
  const todayOrdersCount = allOrders?.filter(o =>
    o.event_date === todayStr && o.status !== 'cancelled' && o.status !== 'draft'
  ).length || 0;

  // Total unread messages
  const totalUnread = conversations?.reduce((acc, c) => acc + (c.unread_count || 0), 0) || 0;

  // Build capacity data from real DB
  const capacityDays = weekDates.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

    // Check overrides first
    const override = calendarOverrides?.find(o => o.date === dateStr);
    const defaults = defaultsCalendar?.find(d => d.day_of_week === dayOfWeek);

    const isBlocked = override?.is_blocked || false;
    const isOpen = defaults?.is_open ?? true;
    const maxLoad = override?.override_max_load ?? defaults?.max_daily_load ?? 0;
    const currentLoad = dailyLoads?.find(d => d.event_date === dateStr)?.current_load || 0;

    const percent = maxLoad > 0 ? Math.min(Math.round((currentLoad / maxLoad) * 100), 100) : 0;
    const isFull = isBlocked || (maxLoad > 0 && currentLoad >= maxLoad);
    const isClosed = !isOpen || isBlocked;

    return {
      date,
      dayName: format(date, "EEE, d", { locale: fr }),
      percent: isClosed ? 0 : percent,
      isFull,
      isClosed,
    };
  });

  // Process conversations for the messages widget
  const recentMessages = (conversations || []).map(conv => {
    // Get the last message from the messages array
    const msgs = (conv.messages as any[]) || [];
    const lastMsg = msgs.sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const platform = (conv.channels as any)?.platform || "email";
    const customerName = (conv.customers as any)?.full_name || "Client";

    return {
      id: conv.id,
      customerName,
      platform,
      lastMessage: lastMsg?.content || "",
      time: conv.last_message_at,
      unread: conv.unread_count || 0,
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
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenu</p>
                <RevenueFilter />
              </div>
              <h3 className="text-2xl font-bold text-foreground font-serif">{formatPrice(monthlyRevenue, currency)}</h3>
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

          {/* Today's Events */}
          <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Événements du Jour</p>
              <h3 className="text-2xl font-bold text-foreground font-serif">{todayOrdersCount}</h3>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Clients</p>
              <h3 className="text-2xl font-bold text-foreground font-serif">{customerCount || 0}</h3>
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
                <CapacityFilter />
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  {capacityDays.map((day, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 items-center group">
                      <div className="col-span-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors capitalize">
                        {day.dayName}
                      </div>
                      <div className="col-span-9 relative h-3 bg-muted rounded-full overflow-hidden">
                        {day.isClosed ? (
                          <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />
                        ) : (
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${day.isFull ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${day.percent}%`, opacity: day.isFull ? 1 : 0.4 + (day.percent / 200) }}
                          />
                        )}
                      </div>
                      <div className={`col-span-1 text-xs text-right font-medium ${day.isClosed ? 'text-muted-foreground' : day.isFull ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                        {day.isClosed ? 'Fermé' : day.isFull ? 'PLEIN' : `${day.percent}%`}
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
                          order.status === 'confirmed' ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
                            order.status === 'draft' ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800" :
                              "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
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
                {totalUnread > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">{totalUnread} Nouv.</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {recentMessages.length > 0 ? (
                  recentMessages.map((msg) => {
                    const platformStyles: Record<string, { bg: string; text: string }> = {
                      whatsapp: { bg: "bg-[#25D366]/10", text: "text-[#25D366]" },
                      instagram: { bg: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500", text: "" },
                      email: { bg: "bg-blue-500/10", text: "text-blue-500" },
                      messenger: { bg: "bg-blue-600/10", text: "text-blue-600" },
                    };
                    const style = platformStyles[msg.platform] || platformStyles.email;
                    const initial = msg.customerName[0]?.toUpperCase() || "C";
                    const timeAgo = msg.time ? formatTimeAgo(new Date(msg.time)) : "";

                    return (
                      <Link key={msg.id} href="/dashboard/inbox">
                        <div className={`p-4 ${msg.unread > 0 ? 'bg-muted/30 border-border' : 'bg-card border-border/50 hover:border-primary/20'} border hover:bg-muted/50 rounded-xl cursor-pointer transition-all shadow-sm group relative`}>
                          {msg.unread > 0 && <div className="absolute right-2 top-2 w-2 h-2 bg-primary rounded-full" />}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full ${style.bg} flex items-center justify-center ${style.text}`}>
                                {msg.platform === 'instagram' ? (
                                  <div className="w-full h-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-full p-[1.5px]">
                                    <div className="w-full h-full bg-card rounded-full flex items-center justify-center text-foreground text-[10px] font-bold">{initial}</div>
                                  </div>
                                ) : (
                                  <MessageSquare className="h-3 w-3" />
                                )}
                              </div>
                              <span className="text-sm font-bold text-foreground font-serif">{msg.customerName}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">{timeAgo}</span>
                          </div>
                          <p className={`text-xs line-clamp-2 pl-9 ${msg.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}>
                            {msg.lastMessage || "Pas de message"}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium">Aucun message</p>
                    <p className="text-xs mt-1">Les conversations apparaîtront ici</p>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-border bg-muted/50">
                <Link href="/dashboard/inbox">
                  <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-primary font-medium">Aller à la Messagerie</Button>
                </Link>
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
                <p className="text-xs text-white/70 mb-3 font-medium">Il est temps de mettre à jour vos offres pour l'Automne ?</p>
                <button className="w-fit px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/40 transition-colors">Mettre à jour le Menu</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `il y a ${diffD}j`;
}

