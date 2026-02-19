"use client";

import { useState, useCallback } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Users, ChefHat, GripVertical, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/actions/kanban";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KanbanColumn = {
    id: string;   // matches orders.status value
    label: string;
    color: string; // hex
};

export type KanbanOrder = {
    id: string;
    status: string;
    event_date: string | null;
    event_time: string | null;
    total_amount_cents: number;
    guest_count: number | null;
    customers: any;
    capacity_types: any;
};

// ─── Default columns (can be overridden from settings) ────────────────────────

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
    { id: "draft", label: "Brouillon", color: "#94A3B8" },
    { id: "quotation", label: "Devis Envoyé", color: "#60A5FA" },
    { id: "confirmed", label: "Confirmé", color: "#34D399" },
    { id: "in_progress", label: "En Cours", color: "#F59E0B" },
    { id: "completed", label: "Terminé", color: "#8B5CF6" },
    { id: "cancelled", label: "Annulé", color: "#F87171" },
];

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order, isDragging = false }: { order: KanbanOrder; isDragging?: boolean }) {
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const capacityType = Array.isArray(order.capacity_types) ? order.capacity_types[0] : order.capacity_types;

    return (
        <div className={cn(
            "bg-white rounded-xl border border-border p-3.5 shadow-sm group transition-all",
            isDragging ? "shadow-xl rotate-1 opacity-90 scale-105 cursor-grabbing" : "hover:shadow-md cursor-grab"
        )}>
            {/* Client */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                    <p className="font-semibold text-secondary text-sm truncate leading-tight">
                        {customer?.full_name || "Client inconnu"}
                    </p>
                    {customer?.phone && (
                        <p className="text-xs text-muted-foreground truncate">{customer.phone}</p>
                    )}
                </div>
                <Link
                    href={`/dashboard/orders/${order.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-secondary"
                >
                    <Eye className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Meta */}
            <div className="space-y-1">
                {order.event_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{format(new Date(order.event_date + "T00:00:00"), "d MMM yyyy", { locale: fr })}</span>
                        {order.event_time && <span className="text-muted-foreground/60">· {order.event_time.slice(0, 5)}</span>}
                    </div>
                )}
                {capacityType && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ChefHat className="h-3 w-3 shrink-0" />
                        <span className="truncate">{capacityType.name}</span>
                        {order.guest_count ? <span className="text-muted-foreground/60">· {order.guest_count} pers.</span> : null}
                    </div>
                )}
                {order.guest_count && !capacityType && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3 w-3 shrink-0" />
                        <span>{order.guest_count} invités</span>
                    </div>
                )}
            </div>

            {/* Amount */}
            {order.total_amount_cents > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border/50 flex justify-end">
                    <span className="font-mono font-bold text-sm text-primary">
                        {((order.total_amount_cents) / 100).toFixed(2)} €
                    </span>
                </div>
            )}
        </div>
    );
}

// ─── Sortable order card wrapper ──────────────────────────────────────────────

function SortableOrderCard({ order }: { order: KanbanOrder }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: order.id,
        data: { order },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <OrderCard order={order} />
        </div>
    );
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function KanbanColumnView({
    column,
    orders,
    isOver,
}: {
    column: KanbanColumn;
    orders: KanbanOrder[];
    isOver: boolean;
}) {
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div className="flex flex-col min-w-[260px] w-[260px] shrink-0 h-full">
            {/* Sticky column header */}
            <div className="flex items-center justify-between mb-2 px-1 py-1 sticky top-0 z-10 bg-muted/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: column.color }}
                    />
                    <span className="font-semibold text-sm text-secondary">{column.label}</span>
                </div>
                <span className="text-xs bg-muted text-muted-foreground font-medium px-2 py-0.5 rounded-full">
                    {orders.length}
                </span>
            </div>

            {/* Scrollable drop zone */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 rounded-xl p-2 space-y-2.5 overflow-y-auto transition-colors border-2 border-dashed",
                    isOver
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent bg-muted/30"
                )}
            >
                <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                    {orders.map((order) => (
                        <SortableOrderCard key={order.id} order={order} />
                    ))}
                </SortableContext>

                {orders.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 select-none">
                        Glisser ici
                    </div>
                )}
            </div>
        </div>
    );
}


// ─── Main KanbanBoard ─────────────────────────────────────────────────────────

interface KanbanBoardProps {
    initialOrders: KanbanOrder[];
    columns: KanbanColumn[];
}

export function KanbanBoard({ initialOrders, columns }: KanbanBoardProps) {
    const [orders, setOrders] = useState<KanbanOrder[]>(initialOrders);
    const [activeOrder, setActiveOrder] = useState<KanbanOrder | null>(null);
    const [overColumnId, setOverColumnId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const getOrdersByColumn = useCallback(
        (colId: string) => orders.filter((o) => o.status === colId),
        [orders]
    );

    const handleDragStart = (event: DragStartEvent) => {
        const order = orders.find((o) => o.id === event.active.id);
        setActiveOrder(order || null);
    };

    const handleDragOver = (event: any) => {
        const { over } = event;
        if (!over) { setOverColumnId(null); return; }
        // over can be a column droppable or a sortable item inside a column
        const overId = String(over.id);
        const isColumn = columns.some((c) => c.id === overId);
        if (isColumn) {
            setOverColumnId(overId);
        } else {
            // find which column the hovered order belongs to
            const hoveredOrder = orders.find((o) => o.id === overId);
            setOverColumnId(hoveredOrder?.status || null);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveOrder(null);
        setOverColumnId(null);

        if (!over) return;

        const draggedOrderId = String(active.id);
        const overId = String(over.id);

        // Determine target column
        const isColumnDrop = columns.some((c) => c.id === overId);
        let targetStatus: string;

        if (isColumnDrop) {
            targetStatus = overId;
        } else {
            const hoveredOrder = orders.find((o) => o.id === overId);
            if (!hoveredOrder) return;
            targetStatus = hoveredOrder.status;
        }

        const draggedOrder = orders.find((o) => o.id === draggedOrderId);
        if (!draggedOrder || draggedOrder.status === targetStatus) return;

        // Optimistic update
        setOrders((prev) =>
            prev.map((o) => o.id === draggedOrderId ? { ...o, status: targetStatus } : o)
        );

        const result = await updateOrderStatusAction(draggedOrderId, targetStatus);
        if (result.error) {
            toast.error("Erreur : " + result.error);
            // Rollback
            setOrders((prev) =>
                prev.map((o) => o.id === draggedOrderId ? { ...o, status: draggedOrder.status } : o)
            );
        } else {
            const col = columns.find((c) => c.id === targetStatus);
            toast.success(`Déplacé vers "${col?.label || targetStatus}"`);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            {/* Outer: fixed height, horizontal scroll, columns don't grow vertically */}
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: "calc(100vh - 240px)" }}>
                {columns.map((column) => (
                    <KanbanColumnView
                        key={column.id}
                        column={column}
                        orders={getOrdersByColumn(column.id)}
                        isOver={overColumnId === column.id}
                    />
                ))}
            </div>

            {/* Drag overlay */}
            <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {activeOrder && <OrderCard order={activeOrder} isDragging />}
            </DragOverlay>
        </DndContext>
    );
}
