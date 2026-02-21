"use client";

import { Utensils, Plus, Trash2 } from "lucide-react";

interface Service {
    name: string;
    loadCost: number;
    color: string;
}

interface ServicesStepProps {
    services: Service[];
    onChange: (services: Service[]) => void;
}

export function ServicesStep({ services, onChange }: ServicesStepProps) {
    const addService = () => {
        onChange([...services, { name: "Nouveau Service", loadCost: 10, color: "#6b7280" }]);
    };

    const removeService = (idx: number) => {
        onChange(services.filter((_, i) => i !== idx));
    };

    const updateService = (idx: number, updates: Partial<Service>) => {
        const updated = [...services];
        updated[idx] = { ...updated[idx], ...updates };
        onChange(updated);
    };

    return (
        <div className="space-y-8 max-w-lg mx-auto">
            {/* Heading */}
            <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary border border-primary/20 mx-auto">
                    <Utensils className="h-7 w-7" />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    Quels services proposez-vous ?
                </h2>
                <p className="text-muted-foreground">
                    Définissez vos types d&apos;événements et leur &quot;Coût de Charge&quot;
                </p>
            </div>

            {/* Services list */}
            <div className="space-y-3">
                {services.map((service, idx) => (
                    <div
                        key={idx}
                        className="flex gap-4 items-center rounded-2xl p-5 bg-card shadow-sm hover:shadow-md border border-border transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ backgroundColor: service.color }}
                        >
                            {service.loadCost}
                        </div>
                        <div className="flex-1 min-w-0">
                            <input
                                value={service.name}
                                onChange={(e) => updateService(idx, { name: e.target.value })}
                                className="font-medium bg-transparent border-none outline-none w-full text-foreground"
                            />
                        </div>
                        <button
                            onClick={() => removeService(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </div>
                ))}

                <button
                    onClick={addService}
                    className="flex items-center gap-2 text-primary font-medium hover:underline p-3 transition-colors"
                >
                    <Plus className="h-4 w-4" /> Ajouter un service
                </button>
            </div>
        </div>
    );
}
