"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowDown, Facebook, Instagram, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StorefrontTemplate } from "@/lib/storefront-templates";

interface HeroProps {
    orgName: string;
    settings?: any;
    template?: StorefrontTemplate;
}

export function Hero({ orgName, settings, template = "classic" }: HeroProps) {
    const heroImage = settings?.hero_image || "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
    const title = settings?.hero_title || (template === "catering" ? "Best Catering Website" : `Decouvrez ${orgName}`);
    const subtitle = settings?.hero_subtitle || "Home Bistro Super";
    const description = settings?.description || "Des saveurs authentiques creees avec passion. Decouvrez nos plateaux signatures, prepares pour vos evenements et votre boutique en ligne.";

    const scrollToMenu = () => {
        const menu = document.getElementById("menu");
        if (!menu) return;
        const y = menu.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: y, behavior: "smooth" });
    };

    if (template === "catering") {
        return (
            <div className="relative rounded-[30px] overflow-hidden border border-emerald-100 shadow-[0_34px_90px_-52px_rgba(16,84,57,0.5)] bg-gradient-to-br from-[#f7faf6] via-[#eef4ef] to-[#f5f8f2]">
                <div className="grid lg:grid-cols-[0.96fr_1.04fr] min-h-[430px] lg:min-h-[540px]">
                    <div className="px-7 sm:px-10 lg:px-12 py-10 lg:py-12 flex flex-col justify-center">
                        <p className="text-emerald-700 font-semibold text-sm tracking-wide mb-3">{subtitle}</p>
                        <h1 className="font-outfit text-[2.6rem] sm:text-[3.2rem] lg:text-[4.2rem] leading-[0.95] font-extrabold text-zinc-900 tracking-tight max-w-lg">
                            {title}
                        </h1>
                        <p className="mt-5 text-sm sm:text-base text-zinc-600 max-w-md leading-relaxed">
                            {description}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button
                                size="lg"
                                className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-6 shadow-lg shadow-emerald-700/20"
                                onClick={scrollToMenu}
                            >
                                Voir la carte
                                <ArrowDown className="h-4 w-4 ml-1.5" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full border-emerald-200 text-emerald-800 hover:bg-emerald-50 px-6 bg-white/90"
                                onClick={() => {
                                    const about = document.getElementById("about");
                                    if (about) about.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                            >
                                En savoir plus
                            </Button>
                        </div>
                    </div>

                    <div className="relative min-h-[300px] lg:min-h-full flex items-center justify-center p-6 sm:p-8 lg:p-10">
                        <div className="absolute top-8 right-10 h-28 w-28 rounded-full bg-red-200/35 blur-2xl" />
                        <div className="absolute bottom-10 left-8 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl" />
                        <div className="relative h-[250px] w-[250px] sm:h-[320px] sm:w-[320px] lg:h-[430px] lg:w-[430px] rounded-[999px] overflow-hidden shadow-[0_30px_70px_-30px_rgba(0,0,0,0.5)] ring-1 ring-black/5">
                            <Image
                                src={heroImage}
                                alt={title}
                                fill
                                priority
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 flex items-center gap-2 bg-white/95 border border-emerald-100 rounded-full px-3 py-2 shadow-md">
                    {[Facebook, Instagram, MessageCircle, Send].map((Icon, index) => (
                        <span key={index} className="h-7 w-7 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center">
                            <Icon className="h-3.5 w-3.5" />
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "relative overflow-hidden group w-full",
            template === "classic" && "rounded-3xl shadow-2xl h-[480px] sm:h-[520px] ring-1 ring-black/5",
            template === "bistro" && "rounded-[30px] shadow-[0_35px_80px_-30px_rgba(0,0,0,0.6)] h-[520px] sm:h-[620px] ring-1 ring-white/15",
            template === "restaurant" && "rounded-[34px] shadow-2xl h-[520px] sm:h-[600px] border border-rose-100"
        )}>
            <Image
                src={heroImage}
                alt={title}
                fill
                className={cn(
                    "object-cover transition-transform duration-700",
                    "group-hover:scale-105"
                )}
                priority
            />
            <div className={cn(
                "absolute inset-0",
                template === "classic" && "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
                template === "bistro" && "bg-gradient-to-tr from-black/90 via-black/45 to-transparent",
                template === "restaurant" && "bg-gradient-to-t from-rose-950/75 via-rose-900/25 to-transparent"
            )}></div>

            <div className={cn(
                "absolute bottom-0 left-0 w-full",
                "p-8 sm:p-10"
            )}>
                <div className={cn(
                    "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
                    "bg-primary text-primary-foreground"
                )}>
                    {subtitle}
                </div>

                <h1 className={cn(
                    "font-serif font-bold text-white mb-4 leading-tight max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100",
                    "text-4xl sm:text-5xl"
                )}>
                    {title}
                </h1>

                <p className={cn(
                    "text-white/90 text-lg max-w-md font-light mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200",
                    template === "bistro" && "max-w-xl"
                )}>
                    {description}
                </p>

                <Button
                    className={cn(
                        "font-semibold font-sans transition-colors gap-2 animate-in fade-in zoom-in duration-500 delay-300",
                        template === "classic" && "bg-card !text-foreground hover:bg-primary hover:!text-white rounded-lg",
                        template === "bistro" && "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-7",
                        template === "restaurant" && "bg-rose-50 !text-rose-900 hover:bg-white rounded-xl border border-rose-200"
                    )}
                    size="lg"
                    onClick={scrollToMenu}
                >
                    Voir le Menu Complet
                    <ArrowDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
