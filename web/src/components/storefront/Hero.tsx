"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowDown, ChevronDown, Facebook, Instagram, MessageCircle, Send, Star } from "lucide-react";
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

    /* ── foodiedash ─────────────────────────────────────────────── */
    if (template === "foodiedash") {
        return (
            <div className="relative overflow-hidden rounded-[30px] bg-[#fffaf5]">
                <div className="grid lg:grid-cols-2 min-h-[480px] lg:min-h-[580px]">
                    {/* Text column */}
                    <div className="px-7 sm:px-10 lg:px-14 py-10 lg:py-14 flex flex-col justify-center">
                        <span className="inline-flex items-center gap-1.5 bg-orange-100 text-[#f27f0d] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-5">
                            <Star className="h-3 w-3 fill-[#f27f0d]" />
                            {subtitle || "Fastest Delivery in Town"}
                        </span>

                        <h1 className="font-outfit text-[2.4rem] sm:text-[3rem] lg:text-[3.8rem] leading-[1.05] font-extrabold text-zinc-900 tracking-tight max-w-lg">
                            {title.split(" ").map((word: string, i: number, arr: string[]) =>
                                i === Math.floor(arr.length / 2) ? (
                                    <span key={i} className="text-[#f27f0d]">{word} </span>
                                ) : (
                                    <span key={i}>{word} </span>
                                )
                            )}
                        </h1>

                        <p className="mt-5 text-sm sm:text-base text-zinc-500 max-w-md leading-relaxed">
                            {description}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button
                                size="lg"
                                className="rounded-full bg-[#f27f0d] hover:bg-[#d96c06] text-white px-7 shadow-lg shadow-orange-400/25"
                                onClick={scrollToMenu}
                            >
                                {settings?.cta_label || "Voir la carte"}
                                <ArrowDown className="h-4 w-4 ml-1.5" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full border-orange-200 text-[#f27f0d] hover:bg-orange-50 px-7"
                                onClick={() => {
                                    const about = document.getElementById("about");
                                    if (about) about.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                            >
                                En savoir plus
                            </Button>
                        </div>

                        {/* Dashed connecting line */}
                        <div className="mt-5 flex items-center gap-2 px-1">
                            <div className="h-px flex-1 border-t border-dashed border-orange-300/50" />
                            <div className="h-1.5 w-1.5 rounded-full bg-[#f27f0d]/40" />
                        </div>

                        {/* Customer avatars */}
                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[
                                    "from-orange-300 to-orange-400",
                                    "from-orange-400 to-orange-500",
                                    "from-orange-500 to-orange-600",
                                    "from-orange-300 to-orange-600",
                                ].map((gradient, i) => (
                                    <div key={i} className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} ring-2 ring-white`} />
                                ))}
                            </div>
                            <p className="text-xs text-zinc-500">
                                <span className="font-semibold text-zinc-700">200+</span> clients satisfaits
                            </p>
                        </div>
                    </div>

                    {/* Image column */}
                    <div className="relative min-h-[320px] lg:min-h-full flex items-center justify-center p-6 sm:p-8 lg:p-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-[80%] rounded-full bg-orange-300/20 blur-3xl" />
                        <div className="relative h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] lg:h-[440px] lg:w-[440px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                            <Image
                                src={heroImage}
                                alt={title}
                                fill
                                priority
                                className="object-cover"
                            />
                            {/* Floating featured card */}
                            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-[#f27f0d] flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-extrabold leading-none">4.9</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-zinc-900 truncate">{settings?.featured_product || "Plat Signature"}</p>
                                    <div className="flex items-center gap-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <Star key={i} className="h-3 w-3 text-[#f27f0d] fill-[#f27f0d]" />
                                        ))}
                                        <span className="text-[10px] text-zinc-400 ml-1">120+ avis</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── elite ────────────────────────────────────────────────── */
    if (template === "elite") {
        return (
            <div className="relative overflow-hidden rounded-[30px] bg-[#120d0b] min-h-[100vh] flex items-center justify-center">
                <Image
                    src={heroImage}
                    alt={title}
                    fill
                    priority
                    className="object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120d0b] via-[#120d0b]/60 to-transparent" />

                {/* Radial glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <p className="text-primary uppercase tracking-[0.3em] text-xs sm:text-sm font-semibold mb-6" style={{ animation: "fadeInUp 0.7s ease forwards" }}>
                        {subtitle || "Michelin Star Experience"}
                    </p>

                    <h1 className="font-serif italic text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-[1.05] mb-8" style={{ animation: "fadeInUp 0.7s ease 0.1s forwards", opacity: 0 }}>
                        {title.split(" ").map((word: string, i: number, arr: string[]) =>
                            i === arr.length - 1 ? (
                                <span key={i} className="text-gold-gradient">{word} </span>
                            ) : (
                                <span key={i}>{word} </span>
                            )
                        )}
                    </h1>

                    <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto mb-10 font-light" style={{ animation: "fadeInUp 0.7s ease 0.2s forwards", opacity: 0 }}>
                        {description}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4" style={{ animation: "fadeInUp 0.7s ease 0.3s forwards", opacity: 0 }}>
                        <Button
                            size="lg"
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 shadow-lg shadow-primary/20"
                            onClick={scrollToMenu}
                        >
                            {settings?.cta_label || "Découvrir le Menu"}
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-full border-white/20 text-white hover:bg-white/10 px-8"
                            onClick={() => {
                                const about = document.getElementById("about");
                                if (about) about.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                        >
                            Réserver
                        </Button>
                    </div>
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/40">
                    <ChevronDown className="h-6 w-6" />
                </div>
            </div>
        );
    }

    /* ── aromabrew ────────────────────────────────────────────── */
    if (template === "aromabrew") {
        return (
            <div className="relative overflow-hidden rounded-[30px] bg-[#221e10]">
                <div className="grid lg:grid-cols-2 min-h-[480px] lg:min-h-[580px]">
                    {/* Text column */}
                    <div className="order-2 lg:order-1 px-7 sm:px-10 lg:px-14 py-10 lg:py-14 flex flex-col justify-center">
                        <span className="inline-flex items-center gap-1.5 bg-[#f4c025]/15 text-[#f4c025] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-5">
                            {subtitle || "Artisanal Roastery"}
                        </span>

                        <h1 className="font-outfit text-[2.4rem] sm:text-[3rem] lg:text-[3.8rem] leading-[1.05] font-extrabold text-white tracking-tight max-w-lg">
                            {title.split(" ").map((word: string, i: number, arr: string[]) =>
                                i === Math.floor(arr.length / 2) ? (
                                    <span key={i} className="text-[#f4c025]">{word} </span>
                                ) : (
                                    <span key={i}>{word} </span>
                                )
                            )}
                        </h1>

                        <p className="mt-5 text-sm sm:text-base text-white/50 max-w-md leading-relaxed">
                            {description}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button
                                size="lg"
                                className="rounded-full bg-[#f4c025] hover:bg-[#daa916] text-[#221e10] font-bold px-7 shadow-lg shadow-yellow-500/20"
                                onClick={scrollToMenu}
                            >
                                {settings?.cta_label || "Voir la carte"}
                                <ArrowDown className="h-4 w-4 ml-1.5" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full border-[#f4c025]/30 text-[#f4c025] hover:bg-[#f4c025]/10 px-7"
                                onClick={() => {
                                    const about = document.getElementById("about");
                                    if (about) about.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                            >
                                En savoir plus
                            </Button>
                        </div>
                    </div>

                    {/* Image column */}
                    <div className="order-1 lg:order-2 relative min-h-[320px] lg:min-h-full flex items-center justify-center p-6 sm:p-8 lg:p-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[70%] w-[70%] rounded-full bg-[#f4c025]/10 blur-3xl" />
                        <div className="absolute top-1/3 left-1/3 h-[50%] w-[50%] rounded-full bg-amber-900/20 blur-3xl" />
                        <div className="relative h-[280px] w-[280px] sm:h-[340px] sm:w-[340px] lg:h-[420px] lg:w-[420px] rounded-[2rem] overflow-hidden shadow-2xl ring-2 ring-[#f4c025]/20">
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
            </div>
        );
    }

    /* ── culina ───────────────────────────────────────────────── */
    if (template === "culina") {
        return (
            <div className="relative overflow-hidden rounded-[30px] bg-[#10221d] min-h-[100vh] flex items-center justify-center">
                <Image
                    src={heroImage}
                    alt={title}
                    fill
                    priority
                    className="object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10221d] via-[#10221d]/50 to-[#10221d]/30" />

                {/* SVG wave curves in background */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 900">
                    <path d="M0,300 C360,220 720,380 1440,280" fill="none" stroke="rgba(249,115,22,0.06)" strokeWidth="1.5" />
                    <path d="M0,500 C480,420 960,580 1440,460" fill="none" stroke="rgba(236,72,153,0.05)" strokeWidth="1.5" />
                    <path d="M0,680 C300,620 600,740 900,660 C1200,580 1350,700 1440,650" fill="none" stroke="rgba(249,115,22,0.04)" strokeWidth="1" />
                </svg>

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto" style={{ animation: "fadeInUp 0.7s ease forwards" }}>
                    <span className="inline-flex items-center gap-1.5 border border-white/20 text-white/70 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
                        {subtitle || "Elevate Your Technique"}
                    </span>

                    <h1 className="font-outfit italic uppercase text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-[1] mb-8 tracking-tight">
                        {title.split(" ").map((word: string, i: number, arr: string[]) =>
                            i >= Math.floor(arr.length / 2) && i < Math.floor(arr.length / 2) + 2 ? (
                                <span key={i} className="inline-block sunset-gradient bg-clip-text text-transparent">{word} </span>
                            ) : (
                                <span key={i}>{word} </span>
                            )
                        )}
                    </h1>

                    <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto mb-10 font-light">
                        {description}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button
                            size="lg"
                            className="rounded-full sunset-gradient text-white font-bold px-8 shadow-lg border-0"
                            onClick={scrollToMenu}
                        >
                            {settings?.cta_label || "Voir la carte"}
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="rounded-full border-white/15 text-white hover:bg-white/10 backdrop-blur-sm px-8"
                            onClick={() => {
                                const about = document.getElementById("about");
                                if (about) about.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                        >
                            En savoir plus
                        </Button>
                    </div>
                </div>

                {/* Curved divider */}
                <div className="flow-curve absolute bottom-0 left-0 w-full h-24 bg-[#10221d]" />
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
