"use client";

import { Calendar, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

export function BookingWidget() {
    const [mode, setMode] = useState<"book" | "order">("book");

    return (
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl p-6 border border-border">
            {/* Tabs */}
            <div className="bg-muted p-1 rounded-lg flex mb-6">
                <button
                    onClick={() => setMode("book")}
                    className={cn(
                        "flex-1 font-semibold py-2 rounded-md text-sm transition-all",
                        mode === "book" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-primary"
                    )}
                >
                    Réserver
                </button>
                <button
                    onClick={() => setMode("order")}
                    className={cn(
                        "flex-1 font-semibold py-2 rounded-md text-sm transition-all",
                        mode === "order" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-primary"
                    )}
                >
                    Commander
                </button>
            </div>

            <div className="space-y-4">
                {/* Date */}
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sélectionnez une date</label>
                    <div className="relative">
                        <Input type="date" className="w-full bg-background border-input" />
                    </div>
                </div>

                {/* Guests */}
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nombre de convives</label>
                    <Input
                        type="number"
                        min="1"
                        defaultValue="2"
                        placeholder="Nombre de personnes"
                        className="w-full bg-background border-input"
                    />
                </div>

                {/* Time Slots */}
                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Heures Disponibles</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button className="py-2 text-sm border border-input rounded-lg hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors">18:00</button>
                        <button className="py-2 text-sm bg-primary text-primary-foreground border border-primary rounded-lg shadow-md shadow-primary/20">19:30</button>
                        <button className="py-2 text-sm border border-input rounded-lg hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors">20:45</button>
                    </div>
                </div>

                <hr className="border-border my-4" />

                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-2">
                    <span>Vérifier la disponibilité</span>
                    <ArrowRight className="h-5 w-5" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">Aucun paiement requis pour la réservation.</p>
            </div>
        </div>
    );
}
