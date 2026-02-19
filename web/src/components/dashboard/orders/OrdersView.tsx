"use client";

import { useState, useTransition } from "react";
import { LayoutGrid, List, Kanban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { KanbanBoard, DEFAULT_KANBAN_COLUMNS, type KanbanColumn, type KanbanOrder } from "@/components/dashboard/orders/KanbanBoard";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { formatPrice } from "@/lib/currencies";
import { bulkDeleteOrdersAction } from "@/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ViewMode = "kanban" | "list" | "grid";

interface OrdersViewProps {
    orders: KanbanOrder[];
    kanbanColumns: KanbanColumn[];
    currency?: string;
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Kanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Aucune commande</h3>
            <p className="text-sm text-muted-foreground">Créez votre premier devis depuis le calendrier ou le bouton ci-dessus.</p>
        </div>
    );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
    orders, columns, currency, selectedIds, toggleSelect, toggleSelectAll,
}: {
    orders: KanbanOrder[];
    columns: KanbanColumn[];
    currency: string;
    selectedIds: Set<string>;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
}) {
    if (orders.length === 0) return <EmptyState />;

    const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
    const someSelected = orders.some(o => selectedIds.has(o.id));

    return (
        <div className="rounded-xl border border-border bg-white shadow-sm">
            <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm border-b border-border">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Tout sélectionner"
                                    data-state={!allSelected && someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                                />
                            </th>
                            {["Client", "Date", "Type", "Invités", "Statut", "Total", ""].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order) => {
                            const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                            const cap = Array.isArray(order.capacity_types) ? order.capacity_types[0] : order.capacity_types;
                            const isSelected = selectedIds.has(order.id);
                            return (
                                <tr
                                    key={order.id}
                                    className={cn("hover:bg-muted/20 transition-colors", isSelected && "bg-primary/5")}
                                >
                                    <td className="px-4 py-3">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(order.id)}
                                            aria-label={`Sélectionner commande ${customer?.full_name}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-foreground">{customer?.full_name || "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {order.event_date ? format(new Date(order.event_date + "T00:00:00"), "d MMM yyyy", { locale: fr }) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{cap?.name || "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{order.guest_count ?? "—"}</td>
                                    <td className="px-4 py-3"><StatusBadge status={order.status} columns={columns} /></td>
                                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                                        {order.total_amount_cents > 0 ? formatPrice(order.total_amount_cents, currency) : "—"}
                                    </td>
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
        </div>
    );
}

// ─── Grid view ────────────────────────────────────────────────────────────────

function GridView({
    orders, columns, currency, selectedIds, toggleSelect,
}: {
    orders: KanbanOrder[];
    columns: KanbanColumn[];
    currency: string;
    selectedIds: Set<string>;
    toggleSelect: (id: string) => void;
}) {
    if (orders.length === 0) return <EmptyState />;
    return (
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-2">
                {orders.map((order) => {
                    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                    const cap = Array.isArray(order.capacity_types) ? order.capacity_types[0] : order.capacity_types;
                    const col = columns.find((c) => c.id === order.status);
                    const isSelected = selectedIds.has(order.id);
                    return (
                        <div
                            key={order.id}
                            className={cn(
                                "group relative bg-white border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all",
                                isSelected && "ring-2 ring-primary border-primary"
                            )}
                        >
                            {/* Color stripe */}
                            <div className="h-1.5" style={{ backgroundColor: col?.color || "#94A3B8" }} />

                            {/* Checkbox */}
                            <div className="absolute top-3 left-3 z-10">
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(order.id)}
                                    aria-label={`Sélectionner commande ${customer?.full_name}`}
                                    className="bg-white/90 border-white/60 opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity shadow-sm"
                                />
                            </div>

                            <Link href={`/dashboard/orders/${order.id}`}>
                                <div className="p-4 space-y-2.5">
                                    <div className="flex items-start justify-between gap-2 pl-5">
                                        <p className="font-semibold text-foreground text-sm">{customer?.full_name || "—"}</p>
                                        <StatusBadge status={order.status} columns={columns} />
                                    </div>
                                    {order.event_date && (
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(order.event_date + "T00:00:00"), "d MMMM yyyy", { locale: fr })}
                                        </p>
                                    )}
                                    {cap && <p className="text-xs text-muted-foreground">{cap.name}{order.guest_count ? ` · ${order.guest_count} pers.` : ""}</p>}
                                    {order.total_amount_cents > 0 && (
                                        <p className="font-mono font-bold text-primary text-sm">{formatPrice(order.total_amount_cents, currency)}</p>
                                    )}
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OrdersView({ orders, kanbanColumns, currency = "EUR" }: OrdersViewProps) {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>("kanban");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, startBulkDelete] = useTransition();

    const columns = kanbanColumns.length > 0 ? kanbanColumns : DEFAULT_KANBAN_COLUMNS;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        const allSelected = orders.length > 0 && orders.every(o => selectedIds.has(o.id));
        setSelectedIds(allSelected ? new Set() : new Set(orders.map(o => o.id)));
    };

    const handleBulkDelete = () => {
        startBulkDelete(async () => {
            const ids = Array.from(selectedIds);
            const result = await bulkDeleteOrdersAction(ids);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} commande(s) supprimée(s).`);
                setSelectedIds(new Set());
                setIsBulkDeleteOpen(false);
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>

                    {/* Bulk action bar — only in list/grid mode */}
                    {selectedIds.size > 0 && view !== "kanban" && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-left-4 duration-200">
                            <span className="text-sm font-medium text-destructive">{selectedIds.size} sélectionné(s)</span>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => setIsBulkDeleteOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                                Annuler
                            </Button>
                        </div>
                    )}
                </div>

                {/* View toggle */}
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
                            onClick={() => { setView(id); setSelectedIds(new Set()); }}
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
            {view === "kanban" && <KanbanBoard initialOrders={orders} columns={columns} currency={currency} />}
            {view === "list" && (
                <ListView
                    orders={orders}
                    columns={columns}
                    currency={currency}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                    toggleSelectAll={toggleSelectAll}
                />
            )}
            {view === "grid" && (
                <GridView
                    orders={orders}
                    columns={columns}
                    currency={currency}
                    selectedIds={selectedIds}
                    toggleSelect={toggleSelect}
                />
            )}

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={isBulkDeleteOpen}
                onOpenChange={setIsBulkDeleteOpen}
                title={`Supprimer ${selectedIds.size} commande(s) ?`}
                description={`Ces ${selectedIds.size} commande(s) et leurs articles associés seront définitivement supprimés. Cette action est irréversible.`}
                confirmLabel={isBulkDeleting ? "Suppression..." : `Supprimer ${selectedIds.size} commande(s)`}
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleBulkDelete}
            />
        </div>
    );
}
