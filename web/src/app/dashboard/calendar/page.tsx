"use server";

import { createClient } from "@/utils/supabase/server";
import { format, startOfMonth, endOfMonth, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ban, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const { data: orders } = await supabase
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
                        // @ts-ignore
                        const dayLoad = dayOrders.reduce((acc, o) => acc + (o.capacity_types?.load_cost || 0), 0);

                        // Adjust mapping: Date-fns getDay() returns 0 for Sunday...6 for Saturday
                        // My week starts on Monday. 
                        // defaults table uses 0=Sunday...6=Saturday usually.
                        const dow = day.getDay();

                        const defaultSettings = defaults?.find(d => d.day_of_week === dow);
                        const maxLimit = defaultSettings?.max_daily_load || 100; // Default limit
                        const isOpen = defaultSettings?.is_open !== false; // Default open

                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);

                        // Load Color
                        const loadPercent = maxLimit > 0 ? (dayLoad / maxLimit) * 100 : 0;
                        let loadColorClass = "bg-green-100 text-green-700 border-green-200";
                        if (loadPercent > 80) loadColorClass = "bg-red-100 text-red-700 border-red-200";
                        else if (loadPercent > 50) loadColorClass = "bg-orange-100 text-orange-700 border-orange-200";

                        return (
                            <div
                                key={dayString}
                                className={cn(
                                    "min-h-[120px] border-b border-r border-border p-2 relative flex flex-col gap-1 transition-colors hover:bg-muted/5 group",
                                    !isCurrentMonth && "bg-muted/5 text-muted-foreground/40 text-sm",
                                    isTodayDate && "bg-blue-50/20"
                                )}
                            >
                                {/* Day Number Header */}
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "h-6 w-6 flex items-center justify-center rounded-full text-sm font-medium",
                                        isTodayDate ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
                                    )}>
                                        {format(day, "d")}
                                    </span>

                                    {isOpen ? (
                                        <span className={cn("text-[10px] px-1.5 rounded-full border font-mono font-medium", loadColorClass)}>
                                            {dayLoad}/{maxLimit}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-1.5 rounded-full border border-gray-200 bg-gray-100 text-gray-400 flex items-center gap-1">
                                            <Ban className="h-3 w-3" /> Fermé
                                        </span>
                                    )}
                                </div>

                                {/* Events List */}
                                <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                                    {dayOrders.map((order: any) => (
                                        <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                                            <div
                                                className={cn(
                                                    "text-xs p-1.5 rounded border shadow-sm transition-all hover:scale-[1.02] cursor-pointer bg-white border-l-4 truncate",
                                                    order.status === 'confirmed' ? "border-l-green-500" :
                                                        order.status === 'draft' ? "border-l-gray-400 opacity-80" : "border-l-orange-400"
                                                )}
                                                title={`${order.customers?.full_name} - ${order.capacity_types?.name}`}
                                            >
                                                <div className="font-semibold text-secondary truncate flex justify-between">
                                                    <span>{order.customers?.full_name?.split(' ')[0] || "Client"}</span>
                                                    {order.event_time && (
                                                        <span className="font-normal text-muted-foreground text-[10px] flex items-center gap-0.5">
                                                            <Clock className="h-3 w-3" /> {order.event_time.slice(0, 5)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground flex justify-between mt-0.5">
                                                    <span>{order.capacity_types?.name}</span>
                                                    <span>{order.guest_count} pers.</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                    {(dayOrders.length === 0 && isOpen) && (
                                        <Link href={`/dashboard/orders/new?date=${dayString}`} className="opacity-0 group-hover:opacity-100 transition-opacity h-full flex items-center justify-center">
                                            <Button variant="ghost" size="sm" className="h-6 w-full text-xs border border-dashed border-border text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/30">
                                                + Ajouter
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
