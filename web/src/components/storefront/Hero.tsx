"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero({ orgName, settings }: { orgName: string, settings?: any }) {
    const heroImage = settings?.hero_image || "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
    const title = settings?.hero_title || "Goûtez l'Essence de l'Épice Dorée";
    const subtitle = settings?.hero_subtitle || "Plat Signature";
    const description = settings?.description || "Des saveurs authentiques créées avec passion. Découvrez nos plateaux primés conçus pour le partage.";

    return (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl group h-[480px] sm:h-[520px] w-full ring-1 ring-black/5">
            <Image
                src={heroImage}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            <div className="absolute bottom-0 left-0 p-8 sm:p-10 w-full">
                <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {subtitle}
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                    {title}
                </h1>

                <p className="text-white/90 text-lg max-w-md font-light mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    {description}
                </p>

                <Button
                    className="bg-white text-secondary hover:bg-primary hover:text-white rounded-lg font-semibold transition-colors gap-2 animate-in fade-in zoom-in duration-500 delay-300"
                    size="lg"
                    onClick={() => {
                        const menu = document.getElementById("menu");
                        if (menu) {
                            // Account for sticky header (approx 80px) + some buffer
                            const y = menu.getBoundingClientRect().top + window.scrollY - 100;
                            window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                    }}
                >
                    Voir le Menu Complet
                    <ArrowDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
