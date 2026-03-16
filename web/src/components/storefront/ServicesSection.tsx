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

    if (template === "foodiedash") {
        const categoryIcons = [
            UtensilsCrossed, Soup, Bike, ShieldCheck, ReceiptText, BriefcaseBusiness,
        ];
        const categoryCards = services.slice(0, 6).map((svc, index) => ({
            ...svc,
            Icon: categoryIcons[index % categoryIcons.length],
        }));

        return (
            <section id="services" className="scroll-mt-24 py-16 lg:py-24">
                <div className="text-center space-y-3 mb-10">
                    <span className="text-primary font-semibold tracking-widest uppercase text-xs">Explorer</span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-secondary">{title}</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categoryCards.map((card) => (
                        <div
                            key={card.id}
                            className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            <div className="h-14 w-14 rounded-full bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-colors duration-300">
                                <card.Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                            </div>
                            <h3 className="font-semibold text-sm text-secondary text-center">{card.title}</h3>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (template === "elite") {
        const featured = services[0];

        return (
            <section id="services" className="scroll-mt-24 py-16 lg:py-24">
                <div className="text-center space-y-3 mb-12">
                    <span className="text-primary font-medium tracking-widest uppercase text-xs">Recommendation du Chef</span>
                    <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white">{title}</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">{subtitle}</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
                    <div className="relative h-[380px] lg:h-[460px] rounded-2xl overflow-hidden">
                        {/* Decorative border corners */}
                        <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-primary z-10" />
                        <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-primary z-10" />
                        <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-primary z-10" />
                        <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-primary z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5 flex items-center justify-center">
                            <span className="text-7xl opacity-70">{featured.emoji}</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <h3 className="text-3xl font-serif font-bold text-white">{featured.title}</h3>
                        <p className="text-zinc-400 leading-relaxed">{featured.description}</p>
                        <p className="text-sm text-zinc-400 italic border-l-2 border-primary pl-4">
                            {settings?.wine_pairing_note || "Accompagnement recommande par notre sommelier pour une experience complete."}
                        </p>
                        <button
                            onClick={() => {
                                const el = document.getElementById("menu");
                                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Commander maintenant
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (template === "aromabrew") {
        return (
            <section id="services" className="scroll-mt-24 py-16 lg:py-24">
                <div className="text-center space-y-3 mb-10">
                    <span className="text-primary font-medium tracking-widest uppercase text-xs">Douceurs</span>
                    <h2 className="text-3xl lg:text-4xl font-serif font-bold text-white">{title}</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">{subtitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((svc) => (
                        <div
                            key={svc.id}
                            className="bg-[#2a2418] border border-white/10 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
                                <span className="text-6xl">{svc.emoji}</span>
                            </div>
                            <div className="p-5 space-y-3">
                                <h3 className="font-serif font-bold text-lg text-white">{svc.title}</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">{svc.description}</p>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById("contact");
                                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    className="inline-flex items-center gap-1 bg-[#f4c025] hover:bg-[#daa920] text-zinc-900 text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                                >
                                    Ajouter +
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (template === "culina") {
        return (
            <section id="services" className="scroll-mt-24 py-16 lg:py-24">
                <div className="text-center space-y-4 mb-14">
                    <span className="text-primary font-medium tracking-widest uppercase text-xs">Nos Prestations</span>
                    <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white">{title}</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">{subtitle}</p>
                    <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((svc) => (
                        <div
                            key={svc.id}
                            className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative space-y-4">
                                <div className="text-4xl">{svc.emoji}</div>
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">
                                        {svc.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
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
