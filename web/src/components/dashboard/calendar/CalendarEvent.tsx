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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Clock, User, Users, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface CalendarEventProps {
    order: any; // Ideally type this properly, but 'any' matches current passed data
}

export function CalendarEvent({ order }: CalendarEventProps) {
    const statusColors = {
        draft: "bg-gray-100 text-gray-800 border-gray-200",
        confirmed: "bg-green-100 text-green-800 border-green-200",
        pending: "bg-orange-100 text-orange-800 border-orange-200",
        cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    const statusLabels = {
        draft: "Brouillon",
        confirmed: "Confirmé",
        pending: "En attente",
        cancelled: "Annulé",
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div
                    className={cn(
                        "text-[10px] p-1.5 rounded border shadow-sm transition-all hover:scale-[1.02] cursor-pointer bg-card border-l-2 truncate hover:bg-muted/10",
                        order.status === 'confirmed' ? "border-l-green-500" :
                            order.status === 'draft' ? "border-l-gray-400 opacity-80" : "border-l-orange-400"
                    )}
                    title={`${order.customers?.full_name} - ${order.capacity_types?.name}`}
                >
                    <div className="font-semibold text-secondary dark:text-foreground truncate flex justify-between items-center">
                        <span>{order.customers?.full_name?.split(' ')[0] || "Client"}</span>
                        {order.event_time && (
                            <span className="font-normal text-muted-foreground text-[9px] flex items-center gap-0.5">
                                {order.event_time.slice(0, 5)}
                            </span>
                        )}
                    </div>
                    <div className="text-[9px] text-muted-foreground flex justify-between mt-0.5">
                        <span className="truncate max-w-[60px]">{order.capacity_types?.name}</span>
                        <span>{order.guest_count}p</span>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Détails de l'événement</span>
                        <Badge variant="outline" className={cn("capitalize",
                            // @ts-ignore
                            statusColors[order.status] || "bg-gray-100"
                        )}>
                            {/* @ts-ignore */}
                            {statusLabels[order.status] || order.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">{order.customers?.full_name || "Client Inconnu"}</p>
                            <p className="text-xs text-muted-foreground">Client</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium text-sm capitalize">
                                {order.event_date ? format(parseISO(order.event_date), "EEEE d MMMM yyyy", { locale: fr }) : "Date non définie"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {order.event_time ? order.event_time.slice(0, 5) : "Heure non définie"}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">{order.capacity_types?.name || "Type inconnu"}</p>
                            <p className="text-xs text-muted-foreground">{order.guest_count} invités</p>
                        </div>
                    </div>

                    {/* Add more fields here if available in 'order' object, e.g. total amount, specific notes */}
                </div>

                <DialogFooter className="flex-col sm:justify-between sm:flex-row gap-2">
                    {/* Could add quick actions here like 'Call Client' if phone number available */}
                    <div />
                    <Link href={`/dashboard/orders/${order.id}`} className="w-full sm:w-auto">
                        <Button className="w-full gap-2">
                            Voir la commande complète <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
