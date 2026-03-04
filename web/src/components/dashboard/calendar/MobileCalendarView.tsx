"use client";

import { useState, useMemo } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface MobileCalendarViewProps {
  orders: any[];
  viewDate: string; // ISO date string of the current month
  calendarOverrides: { date: string; is_blocked: boolean; reason: string | null }[];
  defaults: { day_of_week: number; is_open: boolean }[];
}

export function MobileCalendarView({
  orders,
  viewDate,
  calendarOverrides,
  defaults,
}: MobileCalendarViewProps) {
  const t = useTranslations("dashboard.calendar");
  const weekLabels = t.raw('weekLabels') as string[];
  const viewDateObj = parseISO(viewDate);
  const monthStart = startOfMonth(viewDateObj);
  const monthEnd = endOfMonth(viewDateObj);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Set of dates (yyyy-MM-dd) that have orders
  const ordersByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const o of orders) {
      if (!o.event_date) continue;
      if (!map[o.event_date]) map[o.event_date] = [];
      map[o.event_date].push(o);
    }
    // Sort each day's orders by time
    for (const key of Object.keys(map)) {
      map[key].sort((a: any, b: any) =>
        (a.event_time || "").localeCompare(b.event_time || "")
      );
    }
    return map;
  }, [orders]);

  // Closed/blocked lookup
  const closedDates = useMemo(() => {
    const set = new Set<string>();
    // From overrides
    for (const o of calendarOverrides) {
      if (o.is_blocked) set.add(o.date);
    }
    return set;
  }, [calendarOverrides]);

  const closedDaysOfWeek = useMemo(() => {
    const set = new Set<number>();
    for (const d of defaults) {
      if (d.is_open === false) set.add(d.day_of_week);
    }
    return set;
  }, [defaults]);

  // Default selected day: today if in current month, otherwise first day with events, otherwise 1st
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (isSameMonth(new Date(), monthStart)) return todayStr;
    // First date with events in this month
    const sorted = Object.keys(ordersByDate)
      .filter((d) => isSameMonth(parseISO(d), monthStart))
      .sort();
    return sorted[0] || format(monthStart, "yyyy-MM-dd");
  });

  const selectedOrders = ordersByDate[selectedDate] || [];

  function isDayClosed(day: Date, dayStr: string): boolean {
    if (closedDates.has(dayStr)) return true;
    if (closedDaysOfWeek.has(day.getDay())) return true;
    return false;
  }

  return (
    <div className="md:hidden flex-1 flex flex-col overflow-hidden">
      {/* Mini calendar grid */}
      <div className="px-3 pt-3 pb-2 border-b border-border bg-card shrink-0">
        {/* Week day headers */}
        <div className="grid grid-cols-7 mb-1">
          {weekLabels.map((label, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-semibold text-muted-foreground uppercase"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, monthStart);
            const today = isToday(day);
            const selected = selectedDate === dayStr;
            const hasEvents = !!ordersByDate[dayStr];
            const closed = isDayClosed(day, dayStr);

            return (
              <button
                key={dayStr}
                onClick={() => setSelectedDate(dayStr)}
                className={cn(
                  "relative flex flex-col items-center justify-center h-9 w-full rounded-full transition-colors",
                  !inMonth && "opacity-30",
                  selected && "bg-primary text-white",
                  !selected && today && "ring-1 ring-primary",
                  !selected && !today && "text-foreground"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium leading-none",
                    closed && inMonth && !selected && "text-destructive line-through"
                  )}
                >
                  {format(day, "d")}
                </span>
                {/* Event dot */}
                {hasEvents && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 w-1 h-1 rounded-full",
                      selected ? "bg-white" : "bg-primary"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Day label + new order button */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">
            {format(parseISO(selectedDate), "EEEE d MMMM", { locale: fr })}
          </p>
          <button
            data-calendar-new-order={selectedDate}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('newOrder')}
          </button>
        </div>

        {selectedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="text-sm">{t('noEventsToday')}</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="divide-y divide-border/50">
              {selectedOrders.map((order: any) => {
                const customer = Array.isArray(order.customers)
                  ? order.customers[0]
                  : order.customers;
                const capType = Array.isArray(order.capacity_types)
                  ? order.capacity_types[0]
                  : order.capacity_types;
                return (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      {capType?.color_code && (
                        <div
                          className="w-1.5 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: capType.color_code }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {customer?.full_name || "Client"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.event_time?.slice(0, 5) || ""}
                          {capType && ` · ${capType.name}`}
                          {order.guest_count
                            ? ` · ${order.guest_count} pers.`
                            : ""}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
