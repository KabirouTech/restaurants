"use client";

import type { ServiceItem } from "@/lib/storefront-types";
import { DEFAULT_SERVICES } from "@/lib/storefront-types";

interface ServicesSectionProps {
    settings: any;
}

export function ServicesSection({ settings }: ServicesSectionProps) {
    const title = settings?.services_title || "Nos Prestations";
    const subtitle = settings?.services_subtitle || "Des formules sur mesure pour chaque occasion";
    const services: ServiceItem[] = (settings?.services && settings.services.length > 0)
        ? settings.services
        : DEFAULT_SERVICES;

    return (
        <section id="services" className="scroll-mt-24 py-16 lg:py-24">
            {/* Header */}
            <div className="text-center space-y-4 mb-14">
                <span className="text-primary font-medium tracking-widest uppercase text-xs">Nos Prestations</span>
                <h2 className="text-4xl lg:text-5xl font-serif font-bold text-secondary">{title}</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
                <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map((svc, i) => (
                    <div
                        key={svc.id}
                        className="group relative bg-card border border-border/50 rounded-2xl p-6 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        {/* Gradient accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative space-y-4">
                            <div className="text-4xl">{svc.emoji}</div>
                            <div>
                                <h3 className="font-serif font-bold text-lg text-secondary group-hover:text-primary transition-colors">
                                    {svc.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                    {svc.description}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const el = document.getElementById("contact");
                                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Demander un devis →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
