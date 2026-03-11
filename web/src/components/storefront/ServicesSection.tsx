"use client";

import type { ServiceItem } from "@/lib/storefront-types";
import { DEFAULT_SERVICES } from "@/lib/storefront-types";
import { cn } from "@/lib/utils";
import {
    UtensilsCrossed,
    Bike,
    ShieldCheck,
    ReceiptText,
    Soup,
    SearchCheck,
    MailCheck,
    BriefcaseBusiness,
} from "lucide-react";

interface ServicesSectionProps {
    settings: any;
}

export function ServicesSection({ settings }: ServicesSectionProps) {
    const template = settings?.storefront_template || "classic";
    const title = settings?.services_title || "Nos Prestations";
    const subtitle = settings?.services_subtitle || "Des formules sur mesure pour chaque occasion";
    const services: ServiceItem[] = (settings?.services && settings.services.length > 0)
        ? settings.services
        : DEFAULT_SERVICES;

    if (template === "catering") {
        const featureIcons = [
            UtensilsCrossed,
            Bike,
            ShieldCheck,
            ReceiptText,
            Soup,
            SearchCheck,
            MailCheck,
            BriefcaseBusiness,
        ];
        const featureCards = Array.from({ length: 8 }).map((_, index) => {
            const source = services[index % services.length];
            return {
                id: `${source.id}-${index}`,
                title: source.title,
                description: source.description,
                Icon: featureIcons[index % featureIcons.length],
            };
        });

        return (
            <section id="services" className="scroll-mt-24 py-14 lg:py-16">
                <div className="text-center space-y-2 mb-7">
                    <p className="text-emerald-700 text-[11px] uppercase tracking-[0.28em] font-semibold">Services</p>
                    <h2 className="text-2xl sm:text-3xl font-outfit font-bold text-zinc-900">{title}</h2>
                    <p className="text-zinc-600 max-w-2xl mx-auto text-sm">{subtitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                    {featureCards.map((card) => (
                        <article
                            key={card.id}
                            className={cn(
                                "rounded-[20px] border border-emerald-100 bg-[#f8fbf8] p-5 min-h-[182px] transition-all duration-300",
                                "hover:shadow-[0_20px_40px_-28px_rgba(21,128,61,0.65)] hover:-translate-y-0.5 hover:border-emerald-200"
                            )}
                        >
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                                <card.Icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-zinc-900 mb-2 text-[1.05rem] leading-tight">{card.title}</h3>
                            <p className="text-xs leading-relaxed text-zinc-600 line-clamp-3">{card.description}</p>
                        </article>
                    ))}
                </div>
            </section>
        );
    }

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
