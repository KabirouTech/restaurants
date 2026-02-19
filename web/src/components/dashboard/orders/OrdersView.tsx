"use client";

import { useState } from "react";
import { LayoutGrid, List, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard, DEFAULT_KANBAN_COLUMNS, type KanbanColumn, type KanbanOrder } from "@/components/dashboard/orders/KanbanBoard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

type ViewMode = "kanban" | "list" | "grid";

interface OrdersViewProps {
    orders: KanbanOrder[];
    kanbanColumns: KanbanColumn[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, columns }: { status: string; columns: KanbanColumn[] }) {
    const col = columns.find((c) => c.id === status);
    return (
        <span
            className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
            style={{ backgroundColor: col?.color || "#94A3B8" }}
        >
            {col?.label || status}
        </span>
    );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ orders, columns }: { orders: KanbanOrder[]; columns: KanbanColumn[] }) {
    if (orders.length === 0) return <EmptyState />;
    return (
        <div className="rounded-xl border border-border overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        {["Client", "Date", "Type", "Invités", "Statut", "Total", ""].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {orders.map((order) => {
                        const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                        const cap = Array.isArray(order.capacity_types) ? order.capacity_types[0] : order.capacity_types;
                        return (
                            <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 font-medium text-secondary">{customer?.full_name || "—"}</td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {order.event_date ? format(new Date(order.event_date + "T00:00:00"), "d MMM yyyy", { locale: fr }) : "—"}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{cap?.name || "—"}</td>
                                <td className="px-4 py-3 text-muted-foreground">{order.guest_count ?? "—"}</td>
                                <td className="px-4 py-3"><StatusBadge status={order.status} columns={columns} /></td>
                                <td className="px-4 py-3 font-mono font-semibold text-primary">{order.total_amount_cents > 0 ? `${(order.total_amount_cents / 100).toFixed(2)} €` : "—"}</td>
                                <td className="px-4 py-3">
                                    <Link href={`/dashboard/orders/${order.id}`}>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs">Voir</Button>
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Grid view ────────────────────────────────────────────────────────────────

function GridView({ orders, columns }: { orders: KanbanOrder[]; columns: KanbanColumn[] }) {
    if (orders.length === 0) return <EmptyState />;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => {
                const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                const cap = Array.isArray(order.capacity_types) ? order.capacity_types[0] : order.capacity_types;
                const col = columns.find((c) => c.id === order.status);
                return (
                    <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                        <div className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="h-1.5" style={{ backgroundColor: col?.color || "#94A3B8" }} />
                            <div className="p-4 space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold text-secondary text-sm">{customer?.full_name || "—"}</p>
                                    <StatusBadge status={order.status} columns={columns} />
                                </div>
                                {order.event_date && (
                                    <p className="text-xs text-muted-foreground">
                                        {format(new Date(order.event_date + "T00:00:00"), "d MMMM yyyy", { locale: fr })}
                                    </p>
                                )}
                                {cap && <p className="text-xs text-muted-foreground">{cap.name}{order.guest_count ? ` · ${order.guest_count} pers.` : ""}</p>}
                                {order.total_amount_cents > 0 && (
                                    <p className="font-mono font-bold text-primary text-sm">{(order.total_amount_cents / 100).toFixed(2)} €</p>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Kanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-secondary mb-1">Aucune commande</h3>
            <p className="text-sm text-muted-foreground">Créez votre premier devis depuis le calendrier ou le bouton ci-dessus.</p>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OrdersView({ orders, kanbanColumns }: OrdersViewProps) {
    const [view, setView] = useState<ViewMode>("kanban");
    const columns = kanbanColumns.length > 0 ? kanbanColumns : DEFAULT_KANBAN_COLUMNS;

    return (
        <div className="space-y-4">
            {/* View toggle */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border">
                    {([
                        { id: "kanban", icon: Kanban, label: "Kanban" },
                        { id: "list", icon: List, label: "Liste" },
                        { id: "grid", icon: LayoutGrid, label: "Grille" },
                    ] as const).map(({ id, icon: Icon, label }) => (
                        <Button
                            key={id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setView(id)}
                            className={cn(
                                "h-7 px-2.5 gap-1.5 text-xs",
                                view === id ? "bg-white shadow-sm text-primary font-semibold" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />{label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {view === "kanban" && <KanbanBoard initialOrders={orders} columns={columns} />}
            {view === "list" && <ListView orders={orders} columns={columns} />}
            {view === "grid" && <GridView orders={orders} columns={columns} />}
        </div>
    );
}
