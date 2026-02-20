"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Calendar as CalendarIcon, User, Calculator } from "lucide-react";
import { toast } from "sonner";
import { createOrderAction } from "@/actions/orders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CapacityType {
    id: string;
    name: string;
    load_cost: number;
}

interface NewOrderDialogProps {
    organizationId: string;
    services: CapacityType[];
}

export function NewOrderDialog({ organizationId, services }: NewOrderDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append("organizationId", organizationId);
        if (date) {
            formData.append("date", format(date, "yyyy-MM-dd"));
        }

        const { success, error } = await createOrderAction(formData);

        if (error) {
            toast.error(error);
            setLoading(false);
        } else {
            setOpen(false);
            setLoading(false);
            // Toast logic would go here
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all font-medium gap-2">
                    <PlusCircle className="h-4 w-4" /> Nouvelle Commande
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif text-foreground">Ajouter une Commande</DialogTitle>
                    <DialogDescription>
                        Saisissez les détails de l'événement pour vérifier la disponibilité.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nom du Client / Événement</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                name="clientName"
                                required
                                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Ex: Mariage Durand"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    name="dateInput" // Just strictly for UI fallback
                                    required
                                    value={date ? format(date, "yyyy-MM-dd") : ""}
                                    onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                                    className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Invités (Est.)</label>
                            <input
                                type="number"
                                name="guestCount"
                                defaultValue={50}
                                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type de Service</label>
                        <div className="grid grid-cols-2 gap-2">
                            {services.map((service) => (
                                <label key={service.id} className="cursor-pointer border rounded-lg p-3 hover:bg-muted/50 transition-colors flex items-center justify-between has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                    <input
                                        type="radio"
                                        name="capacityTypeId"
                                        value={service.id}
                                        required
                                        className="peer sr-only"
                                    />
                                    <div className="text-sm font-medium">
                                        {service.name}
                                    </div>
                                    <div className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                                        {service.load_cost}pts
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3 text-xs text-muted-foreground border border-primary/10">
                        <Calculator className="h-4 w-4 text-primary" />
                        <p>La capacité sera recalculée automatiquement après l'ajout.</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white w-full">
                            {loading ? "Vérification..." : "Ajouter au Calendrier"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
