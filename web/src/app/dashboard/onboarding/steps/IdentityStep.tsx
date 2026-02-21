"use client";

import { User, Building2, AlignLeft } from "lucide-react";

interface IdentityStepProps {
    formData: {
        fullName: string;
        orgName: string;
        orgDescription: string;
    };
    onChange: (updates: Partial<IdentityStepProps["formData"]>) => void;
}

export function IdentityStep({ formData, onChange }: IdentityStepProps) {
    const fields = [
        {
            key: "fullName" as const,
            label: "Votre Nom Complet",
            placeholder: "Ex: Aminata Diallo",
            icon: User,
            type: "input" as const,
        },
        {
            key: "orgName" as const,
            label: "Nom de votre Traiteur / Restaurant",
            placeholder: "Ex: Saveurs de Teranga",
            icon: Building2,
            type: "input" as const,
        },
        {
            key: "orgDescription" as const,
            label: "Description Courte",
            placeholder: "Spécialisé dans les événements traditionnels...",
            icon: AlignLeft,
            type: "textarea" as const,
        },
    ];

    return (
        <div className="space-y-8 max-w-lg mx-auto">
            {/* Heading */}
            <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary border border-primary/20 mx-auto">
                    <User className="h-7 w-7" />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    Dites-nous tout, Chef.
                </h2>
                <p className="text-muted-foreground">
                    Ces informations créeront votre espace de travail
                </p>
            </div>

            {/* Fields with staggered entrance */}
            <div className="space-y-5">
                {fields.map((field, idx) => {
                    const Icon = field.icon;
                    return (
                        <div
                            key={field.key}
                            className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                            style={{ animationDelay: `${(idx + 1) * 150}ms` }}
                        >
                            <label className="text-sm font-medium text-foreground">
                                {field.label}
                            </label>
                            <div className="relative">
                                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
                                {field.type === "textarea" ? (
                                    <textarea
                                        value={formData[field.key]}
                                        onChange={(e) => onChange({ [field.key]: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all h-24 resize-none"
                                        placeholder={field.placeholder}
                                    />
                                ) : (
                                    <input
                                        value={formData[field.key]}
                                        onChange={(e) => onChange({ [field.key]: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                                        placeholder={field.placeholder}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
