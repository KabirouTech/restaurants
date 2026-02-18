"use server";

import { createClient } from "@/utils/supabase/server";
import { format, startOfMonth, endOfMonth, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ban, Clock, ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarEvent } from "@/components/dashboard/calendar/CalendarEvent";

export default async function CalendarPage(props: { searchParams: Promise<{ date?: string }> }) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Non authentifié</div>;

    // Get Org
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return <div>Aucune organisation</div>;
    const orgId = profile.organization_id;

    // 1. Determine Current View Date
    const viewDate = searchParams.date ? parseISO(searchParams.date) : new Date();
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart, { locale: fr, weekStartsOn: 1 }); // Start on Monday
    const calendarEnd = endOfWeek(monthEnd, { locale: fr, weekStartsOn: 1 });

    // 2. Fetch Orders for this range including Customer info
    console.log(`[Calendar] Fetching orders for Org: ${orgId}`);
    console.log(`[Calendar] Date Range: ${format(calendarStart, "yyyy-MM-dd")} to ${format(calendarEnd, "yyyy-MM-dd")}`);

    const { data: orders, error: ordersError } = await supabase
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
        .lte("event_date", format(calendarEnd, "yyyy-MM-dd"));

    if (ordersError) {
        console.error("[Calendar] Error fetching orders:", ordersError);
    } else {
        console.log(`[Calendar] Found ${orders?.length} orders`);
        if (orders && orders.length > 0) {
            console.log("[Calendar] First order:", JSON.stringify(orders[0], null, 2));
        }
    }

    // 3. Fetch Capacity Defaults
    const { data: defaults } = await supabase
        .from("defaults_calendar")
        .select("*")
        .eq("organization_id", orgId);

    // 4. Build Days Array
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    const weekDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

    return (
        <div className="flex flex-col h-screen bg-background text-foreground animate-in fade-in duration-500 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-white shadow-sm shrink-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold font-serif text-secondary capitalize flex items-center gap-2">
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
                    <Link href="/dashboard/orders/new">
                        <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium text-sm h-9">
                            + Nouveau
                        </Button>
                    </Link>
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
                    {days.map((day, i) => {
                        const dayString = format(day, "yyyy-MM-dd");
                        // @ts-ignore
                        const dayOrders = orders?.filter(o => o.event_date === dayString) || [];
                        // Adjust mapping: Date-fns getDay() returns 0 for Sunday...6 for Saturday
                        // defaults table uses 0=Sunday...6=Saturday usually.
                        const dow = day.getDay();
                        const defaultSettings = defaults?.find((d: any) => d.day_of_week === dow);
                        const isOpen = defaultSettings?.is_open !== false; // Default open

                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);

                        return (
                            <div
                                key={dayString}
                                className={cn(
                                    "min-h-[120px] border-b border-r border-border relative flex flex-col transition-colors group bg-card hover:bg-muted/5",
                                    !isCurrentMonth && "bg-muted/10 text-muted-foreground/40",
                                    isTodayDate && "bg-blue-50/10"
                                )}
                            >
                                {/* Day Number Header */}
                                <div className="flex justify-between items-start p-2 border-b border-border/50 bg-muted/20">
                                    <span className={cn(
                                        "h-6 w-6 flex items-center justify-center rounded-full text-sm font-medium",
                                        isTodayDate ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                    {!isOpen && (
                                        <span className="text-[10px] px-1.5 rounded-full border border-border bg-muted text-muted-foreground flex items-center gap-1">
                                            <Ban className="h-3 w-3" /> Fermé
                                        </span>
                                    )}
                                </div>

                                {/* Events List */}
                                <div className="flex-1 p-1 flex flex-col gap-1 overflow-y-auto">
                                    {dayOrders.map((order: any) => (
                                        <CalendarEvent key={order.id} order={order} />
                                    ))}

                                    {/* Add Button Area */}
                                    <Link
                                        href={`/dashboard/orders/new?date=${dayString}`}
                                        className={cn(
                                            "flex-1 min-h-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded border border-dashed border-transparent hover:border-primary/30 hover:bg-primary/5 text-primary/70 hover:text-primary",
                                            dayOrders.length === 0 && "opacity-0 group-hover:opacity-100" // Always visible on hover if empty? Or maybe just keep the opacity transition
                                        )}
                                        title="Ajouter un événement"
                                    >
                                        <Plus className="h-6 w-6" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Debug Info */}
            <details className="p-4 border-t bg-muted/20">
                <summary className="text-xs text-muted-foreground cursor-pointer">Debug Info</summary>
                <pre className="text-[10px] whitespace-pre-wrap mt-2">
                    {JSON.stringify({
                        orgId,
                        calendarStart: format(calendarStart, "yyyy-MM-dd"),
                        calendarEnd: format(calendarEnd, "yyyy-MM-dd"),
                        ordersCount: orders?.length,
                        ordersError: ordersError,
                        firstOrder: orders?.[0]
                    }, null, 2)}
                </pre>
            </details>
        </div>
    );
}
