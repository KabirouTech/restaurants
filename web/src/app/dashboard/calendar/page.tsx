"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { format, startOfMonth, endOfMonth, startOfDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ban, Plus, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "@/components/dashboard/calendar/CalendarEvent";
import { CalendarShell } from "@/components/dashboard/calendar/CalendarShell";

export default async function CalendarPage(props: { searchParams: Promise<{ date?: string }> }) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Non authentifié</div>;

    // Get Org
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return <div>Aucune organisation</div>;
    const orgId = profile.organization_id;

    // Get Org Currency
    const { data: orgData } = await supabase.from("organizations").select("settings").eq("id", orgId).single();
    const currency = (orgData?.settings as any)?.currency || "EUR";

    // 1. Determine Current View Date
    const viewDate = searchParams.date ? parseISO(searchParams.date) : new Date();
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart, { locale: fr, weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { locale: fr, weekStartsOn: 1 });

    // Use Service Role to bypass RLS
    const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Fetch Orders
    const { data: orders, error: ordersError } = await supabaseAdmin
        .from("orders")
        .select(`
            id,
            event_date,
            event_time,
            status,
            guest_count,
            customers (full_name),
            capacity_types (
                name,
                load_cost,
                color_code
            )
        `)
        .eq("organization_id", orgId)
        .gte("event_date", format(calendarStart, "yyyy-MM-dd"))
        .lt("event_date", format(addDays(calendarEnd, 1), "yyyy-MM-dd"));

    if (ordersError) console.error("[Calendar] Error fetching orders:", ordersError);

    // 3. Fetch Capacity Defaults
    const { data: defaults } = await supabase
        .from("defaults_calendar")
        .select("*")
        .eq("organization_id", orgId);

    // 4. Fetch Customers, Capacity Types, Products & Calendar Overrides
    const [{ data: customers }, { data: capacityTypes }, { data: products }, { data: calendarOverrides }] = await Promise.all([
        supabase
            .from("customers")
            .select("id, full_name, email, phone")
            .eq("organization_id", orgId)
            .order("full_name")
            .limit(100),
        supabase
            .from("capacity_types")
            .select("id, name")
            .eq("organization_id", orgId),
        supabase
            .from("products")
            .select("id, name, description, price_cents, category")
            .eq("organization_id", orgId)
            .eq("is_active", true)
            .order("name"),
        supabaseAdmin
            .from("calendar_overrides")
            .select("date, is_blocked, reason")
            .eq("organization_id", orgId)
            .gte("date", format(calendarStart, "yyyy-MM-dd"))
            .lte("date", format(calendarEnd, "yyyy-MM-dd")),
    ]);

    // 5. Build Days Array
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

    return (
        <CalendarShell customers={customers || []} capacityTypes={capacityTypes || []} products={products || []} currency={currency}>

            <div className="flex flex-col h-screen bg-background text-foreground animate-in fade-in duration-500 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-card shadow-sm shrink-0 z-10">
                    <div>
                        <h1 className="text-2xl font-bold font-serif text-foreground capitalize flex items-center gap-2">
                            {format(viewDate, "MMMM yyyy", { locale: fr })}
                            <span className="text-sm font-sans font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {orders?.length || 0} événements
                            </span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-muted/30 p-1 rounded-lg border border-border flex items-center mr-4">
                            <Link href={`?date=${format(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1), "yyyy-MM-dd")}`}>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                            </Link>
                            <Link href={`?date=${format(new Date(), "yyyy-MM-dd")}`}>
                                <Button variant="ghost" size="sm" className="h-7 text-xs font-medium px-2">Aujourd'hui</Button>
                            </Link>
                            <Link href={`?date=${format(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1), "yyyy-MM-dd")}`}>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </Link>
                        </div>

                        {/* "Nouveau" button in the header also opens the dialog (today's date) */}
                        <button
                            data-calendar-new-order={format(new Date(), "yyyy-MM-dd")}
                            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm font-medium text-sm h-9 px-4 rounded-md transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Nouveau
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Week Header */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/60 shrink-0">
                        {weekDays.map((day, i) => (
                            <div key={i} className="py-2 text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-y-auto">
                        {days.map((day) => {
                            const dayString = format(day, "yyyy-MM-dd");
                            // @ts-ignore
                            const dayOrders = orders?.filter(o => o.event_date && isSameDay(parseISO(o.event_date), day)) || [];
                            const dow = day.getDay();
                            const defaultSettings = defaults?.find((d: any) => d.day_of_week === dow);
                            const isOpen = defaultSettings?.is_open !== false;
                            const override = calendarOverrides?.find(o => o.date === dayString);
                            const isBlocked = override?.is_blocked || false;
                            const isClosed = !isOpen || isBlocked;

                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isTodayDate = isToday(day);
                            const isPast = isBefore(day, startOfDay(new Date())) && !isTodayDate;

                            return (
                                <div
                                    key={dayString}
                                    className={cn(
                                        "min-h-[120px] border-b border-r border-border relative flex flex-col transition-colors bg-card",
                                        !isPast && "group hover:bg-muted/5",
                                        !isCurrentMonth && "bg-muted/10 text-muted-foreground/40",
                                        isPast && "opacity-50 cursor-default",
                                        isClosed && !isPast && "bg-red-100/80 dark:bg-red-950/40 border-r-red-200 dark:border-r-red-900/50",
                                        isTodayDate && !isClosed && "bg-blue-50/10"
                                    )}
                                >
                                    {/* Day Number Header */}
                                    <div className={cn(
                                        "flex justify-between items-start p-2 border-b border-border/50",
                                        isClosed && !isPast ? "bg-red-200/70 dark:bg-red-900/40" : "bg-muted/20"
                                    )}>
                                        <span className={cn(
                                            "h-6 w-6 flex items-center justify-center rounded-full text-sm font-medium",
                                            isTodayDate ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
                                        )}>
                                            {format(day, "d")}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {isClosed && !isPast && (
                                                <span className="text-[10px] px-1.5 rounded-full border border-red-300 dark:border-red-700 bg-red-200 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-semibold flex items-center gap-1">
                                                    <Ban className="h-3 w-3" /> Fermé
                                                </span>
                                            )}
                                            {isBlocked && !isPast && (
                                                <button
                                                    data-calendar-reopen-date={dayString}
                                                    className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                    title="Rouvrir cette date"
                                                >
                                                    <LockOpen className="h-3 w-3" /> Rouvrir
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Override reason */}
                                    {isBlocked && !isPast && override?.reason && (
                                        <div className="px-2 py-1 text-[10px] text-muted-foreground italic truncate">
                                            {override.reason}
                                        </div>
                                    )}

                                    {/* Events area */}
                                    <div className="flex-1 relative">
                                        {/* + button for new order (hidden on past dates) */}
                                        {!isPast && (
                                            <button
                                                data-calendar-new-order={dayString}
                                                className="absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-primary/50 hover:text-primary"
                                                title="Ajouter un événement"
                                            >
                                                <span className="flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-colors">
                                                    <Plus className="h-4 w-4" />
                                                </span>
                                            </button>
                                        )}

                                        {/* Close date button (hidden on past & closed dates) */}
                                        {!isClosed && !isPast && (
                                            <button
                                                data-calendar-close-date={dayString}
                                                className="absolute z-20 bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground/50 hover:text-destructive"
                                                title="Fermer cette date"
                                            >
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-destructive/10 transition-colors">
                                                    <Ban className="h-3.5 w-3.5" />
                                                </span>
                                            </button>
                                        )}

                                        {/* Existing orders (still visible on past dates, read-only) */}
                                        {dayOrders.length > 0 && (
                                            <div className="relative z-10 flex flex-wrap gap-1.5 p-1.5 pt-2">
                                                {dayOrders.map((order: any, idx: number) => (
                                                    <CalendarEvent key={order.id} order={order} index={idx} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </CalendarShell>
    );
}
