"use client";

import { useState, useCallback, useTransition } from "react";
import { CalendarQuickOrderDialog } from "@/components/dashboard/calendar/CalendarQuickOrderDialog";
import { CloseDateDialog } from "@/components/dashboard/CloseDateDialog";
import { openDateAction } from "@/actions/calendar";
import { toast } from "sonner";

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

    const [closeDateDialogOpen, setCloseDateDialogOpen] = useState(false);
    const [closeDateSelected, setCloseDateSelected] = useState("");

    const [, startTransition] = useTransition();

    // Called from CalendarCellTrigger buttons via a custom event
    const handleOpenDialog = useCallback((date: string) => {
        setSelectedDate(date);
        setDialogOpen(true);
    }, []);

    const handleOpenCloseDateDialog = useCallback((date: string) => {
        setCloseDateSelected(date);
        setCloseDateDialogOpen(true);
    }, []);

    const handleReopenDate = useCallback((date: string) => {
        startTransition(async () => {
            const result = await openDateAction(date);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Date rouverte avec succès");
            }
        });
    }, []);

    return (
        <div
            className="contents"
            // Listen for the custom events dispatched by cell buttons
            onClickCapture={(e) => {
                const target = e.target as HTMLElement;

                // New order dialog
                const newOrderBtn = target.closest<HTMLButtonElement>("[data-calendar-new-order]");
                if (newOrderBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenDialog(newOrderBtn.dataset.calendarNewOrder ?? "");
                    return;
                }

                // Close date dialog
                const closeDateBtn = target.closest<HTMLButtonElement>("[data-calendar-close-date]");
                if (closeDateBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenCloseDateDialog(closeDateBtn.dataset.calendarCloseDate ?? "");
                    return;
                }

                // Reopen date action
                const reopenBtn = target.closest<HTMLButtonElement>("[data-calendar-reopen-date]");
                if (reopenBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReopenDate(reopenBtn.dataset.calendarReopenDate ?? "");
                    return;
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

            <CloseDateDialog
                open={closeDateDialogOpen}
                onOpenChange={setCloseDateDialogOpen}
                defaultDate={closeDateSelected}
            />

        </div>
    );
}
