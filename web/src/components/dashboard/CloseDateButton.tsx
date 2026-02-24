"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { CloseDateDialog } from "./CloseDateDialog";

export function CloseDateButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                className="flex items-center gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/5 font-medium text-sm h-10 px-5"
                onClick={() => setOpen(true)}
            >
                <Ban className="h-4 w-4" />
                Fermer une date
            </Button>
            <CloseDateDialog open={open} onOpenChange={setOpen} />
        </>
    );
}
