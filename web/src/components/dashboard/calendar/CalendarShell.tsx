"use client";

import { useState, useCallback } from "react";
import { CalendarQuickOrderDialog } from "@/components/dashboard/calendar/CalendarQuickOrderDialog";

type Customer = { id: string; full_name: string; email: string; phone: string };
type CapacityType = { id: string; name: string };
type Product = { id: string; name: string; description: string; price_cents: number; category: string };


interface CalendarShellProps {
    children: React.ReactNode;
    customers: Customer[];
    capacityTypes: CapacityType[];
    products: Product[];
}


/**
 * Thin client wrapper around the calendar grid.
 * Manages the quick order dialog state globally so any cell's "+" button
 * can trigger it by dispatching a custom event.
 */
export function CalendarShell({ children, customers, capacityTypes, products }: CalendarShellProps) {

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");

    // Called from CalendarCellTrigger buttons via a custom event
    const handleOpenDialog = useCallback((date: string) => {
        setSelectedDate(date);
        setDialogOpen(true);
    }, []);

    return (
        <div
            className="contents"
            // Listen for the custom event dispatched by cell buttons
            onClickCapture={(e) => {
                const target = e.target as HTMLElement;
                const btn = target.closest<HTMLButtonElement>("[data-calendar-new-order]");
                if (btn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const date = btn.dataset.calendarNewOrder ?? "";
                    handleOpenDialog(date);
                }
            }}
        >
            {children}

            <CalendarQuickOrderDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                defaultDate={selectedDate}
                customers={customers}
                capacityTypes={capacityTypes}
                products={products}
            />

        </div>
    );
}
