"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, User, Users, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// Vibrant palette – used as fallback when no capacity_type color is assigned
const FALLBACK_PALETTE = [
    "#F97316", // Orange (primary)
    "#8B5CF6", // Violet
    "#06B6D4", // Cyan
    "#10B981", // Emerald
    "#F43F5E", // Rose
    "#EAB308", // Yellow
    "#3B82F6", // Blue
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#A16207", // Amber-dark
];

/** Derive a stable color for an order. Prefers capacity_type color_code, falls back to palette. */
function getOrderColor(order: any, index: number): string {
    if (order.capacity_types?.color_code) {
        return order.capacity_types.color_code;
    }
    // Use the last chars of the UUID for deterministic color pick
    const seed = parseInt(order.id?.slice(-4) || "0", 16);
    return FALLBACK_PALETTE[seed % FALLBACK_PALETTE.length];
}

/** Hex → rgba helper for translucent backgrounds */
function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const statusLabels: Record<string, string> = {
    draft: "Brouillon",
    confirmed: "Confirmé",
    pending: "En attente",
    cancelled: "Annulé",
};

interface CalendarEventProps {
    order: any;
    index: number; // position within the day, for palette fallback
}

export function CalendarEvent({ order, index }: CalendarEventProps) {
    const color = getOrderColor(order, index);
    const bgSoft = hexToRgba(color, 0.12);
    const bgMedium = hexToRgba(color, 0.18);
    const statusLabel = statusLabels[order.status] || order.status;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {/* Colored dot – the only thing shown inside the calendar cell */}
                <button
                    title={`${order.customers?.full_name || "Client"} — ${order.capacity_types?.name || statusLabel}`}
                    className="group relative flex items-center justify-center focus:outline-none"
                >
                    <span
                        className="block w-3 h-3 rounded-full ring-2 ring-white shadow-md transition-transform duration-150 group-hover:scale-125 group-focus:scale-125"
                        style={{ backgroundColor: color }}
                    />
                </button>
            </DialogTrigger>

            {/* Detail modal – header tinted with the order's color */}
            <DialogContent
                className="sm:max-w-[440px] overflow-hidden p-0 gap-0"
                style={{ borderColor: hexToRgba(color, 0.4) }}
            >
                {/* Colored header band */}
                <div
                    className="px-6 pt-6 pb-5"
                    style={{ backgroundColor: bgSoft, borderBottom: `1px solid ${hexToRgba(color, 0.2)}` }}
                >
                    <DialogHeader>
                        <DialogTitle className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span
                                    className="inline-block w-3 h-3 rounded-full shrink-0 mt-[3px]"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-foreground font-serif font-bold text-lg leading-tight">
                                    {order.customers?.full_name || "Client Inconnu"}
                                </span>
                            </div>
                            <span
                                className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 mt-0.5"
                                style={{ backgroundColor: bgMedium, color }}
                            >
                                {statusLabel}
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="px-6 py-5 grid gap-4">
                    <div className="flex items-start gap-3">
                        <Calendar
                            className="h-5 w-5 mt-0.5 shrink-0"
                            style={{ color }}
                        />
                        <div>
                            <p className="font-medium text-sm text-foreground capitalize">
                                {order.event_date
                                    ? format(parseISO(order.event_date), "EEEE d MMMM yyyy", { locale: fr })
                                    : "Date non définie"}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3" />
                                {order.event_time ? order.event_time.slice(0, 5) : "Heure non définie"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <User
                            className="h-5 w-5 mt-0.5 shrink-0"
                            style={{ color }}
                        />
                        <div>
                            <p className="font-medium text-sm text-foreground">
                                {order.customers?.full_name || "Client Inconnu"}
                            </p>
                            <p className="text-xs text-muted-foreground">Client</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Users
                            className="h-5 w-5 mt-0.5 shrink-0"
                            style={{ color }}
                        />
                        <div>
                            <p className="font-medium text-sm text-foreground">
                                {order.capacity_types?.name || "Type non défini"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {order.guest_count ? `${order.guest_count} invités` : "Nombre d'invités non défini"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter
                    className="px-6 py-4 border-t"
                    style={{ borderColor: hexToRgba(color, 0.2), backgroundColor: bgSoft }}
                >
                    <Link href={`/dashboard/orders/${order.id}`} className="w-full">
                        <Button
                            className="w-full gap-2 text-white font-semibold"
                            style={{ backgroundColor: color }}
                        >
                            Voir la commande complète <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
