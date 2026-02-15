"use client";

import { Button } from "@/components/ui/button";
import { Printer, Mail } from "lucide-react";

export function OrderActions() {
    return (
        <div className="flex gap-2 print:hidden">
            <Button variant="outline" className="gap-2" onClick={() => alert("Fonctionnalité d'envoi d'email à venir !")}>
                <Mail className="h-4 w-4" /> Envoyer par Email
            </Button>
            <Button className="bg-primary text-white gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimer / PDF
            </Button>
        </div>
    );
}
