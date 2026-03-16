"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { useState, useEffect } from "react";
import { Instagram, Facebook, ShoppingCart, Sun, Moon, Search, Coffee, User } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";
import type { StorefrontSection } from "@/lib/storefront-types";
import { useCart } from "@/context/CartContext";
import { useTheme } from "next-themes";
import type { StorefrontTemplate } from "@/lib/storefront-templates";

interface StorefrontHeaderProps {
    orgName: string;
    settings?: any;
    sections: StorefrontSection[];
    template?: StorefrontTemplate;
}

export function StorefrontHeader({ orgName, settings, sections, template = "classic" }: StorefrontHeaderProps) {
    const logoUrl = settings?.logo_url;
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState("hero");
    const pathname = usePathname();
    const { items, openCart } = useCart();
    const { theme, setTheme } = useTheme();

    const cartCount = items.reduce((s, i) => s + i.quantity, 0);

    const cateringSectionOrder: Record<string, number> = {
        services: 0,
        menu: 1,
        about: 2,
        testimonials: 3,
        gallery: 4,
        contact: 5,
    };
    const enabledSections = template === "catering"
        ? [...sections.filter((s) => s.enabled)].sort(
            (a, b) => (cateringSectionOrder[a.id] ?? 99) - (cateringSectionOrder[b.id] ?? 99)
        )
        : sections.filter((s) => s.enabled);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // IntersectionObserver for active section highlight
    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        enabledSections.forEach(({ anchor }) => {
            const el = document.getElementById(anchor);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(anchor); },
                { rootMargin: "-40% 0px -55% 0px" }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, [enabledSections]);

    const scrollTo = (anchor: string) => {
        const el = document.getElementById(anchor);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    const getNavStyle = (tmpl: StorefrontTemplate, isActive: boolean): string => {
        if (isActive) {
            switch (tmpl) {
                case "catering": return "bg-emerald-700 text-white shadow-sm";
                case "foodiedash": return "bg-[#f27f0d] text-white shadow-sm";
                case "elite": return "bg-primary text-primary-foreground shadow-sm";
                case "aromabrew": return "bg-[#f4c025] text-zinc-900 shadow-sm";
                case "culina": return "bg-emerald-400 text-zinc-900 shadow-sm";
                default: return "bg-primary text-primary-foreground shadow-sm";
            }
        }
        switch (tmpl) {
            case "bistro":
            case "elite": return "text-zinc-300 hover:text-white hover:bg-white/10";
            case "catering": return "text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50";
            case "foodiedash": return "text-zinc-600 hover:text-[#f27f0d] hover:bg-orange-50";
            case "aromabrew": return "text-zinc-400 hover:text-[#f4c025] hover:bg-white/5";
            case "culina": return "text-zinc-400 hover:text-emerald-400 hover:bg-white/5";
            default: return "text-muted-foreground hover:text-foreground hover:bg-muted/50";
        }
    };

    return (
        <>
            <header className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                template === "classic" && "bg-background/95 backdrop-blur-md border-b border-border",
                template === "bistro" && "bg-zinc-950/90 backdrop-blur-md border-b border-white/10 text-zinc-100",
                template === "catering" && "bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm",
                template === "restaurant" && "bg-gradient-to-r from-rose-50/95 to-orange-50/95 backdrop-blur-md border-b border-rose-100",
                template === "foodiedash" && "bg-[#f8f7f5]/80 backdrop-blur-md border-b border-orange-100",
                template === "elite" && "bg-[#120d0b]/90 backdrop-blur-md border-b border-white/10 text-zinc-100",
                template === "aromabrew" && "bg-[#221e10]/80 backdrop-blur-md border-b border-yellow-500/10 text-zinc-100",
                template === "culina" && "bg-[#10221d]/80 backdrop-blur-md border-b border-emerald-400/10 text-zinc-100",
                scrolled ? "shadow-sm" : ""
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

                    {/* Brand */}
                    <Link
                        href={pathname || "#"}
                        onClick={(e) => {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="flex items-center gap-2.5 group"
                    >

                        {logoUrl ? (
                            <Image src={logoUrl} alt={orgName} width={40} height={40} className="object-contain rounded-md" />
                        ) : template === "aromabrew" ? (
                            <Coffee className="h-7 w-7 text-[#f4c025]" />
                        ) : (
                            <LogoMark size="md" />
                        )}
                        <span className={cn(
                            "font-serif font-bold text-xl tracking-tight transition-colors",
                            template === "bistro" && "text-zinc-100",
                            template === "elite" && "text-zinc-100 italic uppercase tracking-widest text-lg",
                            template === "aromabrew" && "text-zinc-100",
                            template === "culina" && "text-emerald-400 font-sans font-extrabold",
                            template === "foodiedash" && "text-foreground",
                            !["bistro", "elite", "aromabrew", "culina", "foodiedash"].includes(template) && "text-foreground"
                        )}>
                            {orgName}<span className={cn(
                                "text-primary",
                                template === "foodiedash" && "text-[#f27f0d]",
                                template === "elite" && "text-primary",
                                template === "aromabrew" && "text-[#f4c025]",
                                template === "culina" && "text-emerald-400"
                            )}>.</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {enabledSections.map(({ anchor, label }) => (
                            <button
                                key={anchor}
                                onClick={() => scrollTo(anchor)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    getNavStyle(template, activeSection === anchor)
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {template === "catering" && (
                            <button
                                onClick={openCart}
                                className="hidden md:inline-flex items-center gap-2 rounded-full bg-emerald-700 text-white px-5 py-2 text-sm font-semibold hover:bg-emerald-800 transition-colors"
                            >
                                Pantry
                                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-white/20 text-[11px] font-bold">
                                    {cartCount}
                                </span>
                            </button>
                        )}

                        {/* foodiedash: search bar + Sign Up button */}
                        {template === "foodiedash" && (
                            <>
                                <div className="hidden md:flex items-center bg-zinc-100 rounded-full px-3 py-1.5 gap-2">
                                    <Search className="h-4 w-4 text-zinc-400" />
                                    <input type="text" placeholder="Rechercher..." className="bg-transparent text-sm outline-none w-28 placeholder:text-zinc-400" />
                                </div>
                                <button
                                    onClick={() => scrollTo("contact")}
                                    className="hidden md:inline-flex items-center rounded-full bg-[#f27f0d] text-white px-5 py-2 text-sm font-semibold hover:bg-[#e06f00] transition-colors"
                                >
                                    Commander
                                </button>
                            </>
                        )}

                        {/* elite: Reserve Now button */}
                        {template === "elite" && (
                            <button
                                onClick={() => scrollTo("contact")}
                                className="hidden md:inline-flex items-center rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Réserver
                            </button>
                        )}

                        {/* aromabrew: search bar + Order Now button */}
                        {template === "aromabrew" && (
                            <>
                                <div className="hidden md:flex items-center bg-white/10 rounded-full px-3 py-1.5 gap-2 border border-[#f4c025]/20">
                                    <Search className="h-4 w-4 text-zinc-400" />
                                    <input type="text" placeholder="Rechercher..." className="bg-transparent text-sm outline-none w-28 placeholder:text-zinc-500 text-zinc-100" />
                                </div>
                                <button
                                    onClick={() => scrollTo("menu")}
                                    className="hidden md:inline-flex items-center rounded-full bg-[#f4c025] text-zinc-900 px-5 py-2 text-sm font-bold hover:bg-[#e5b320] transition-colors"
                                >
                                    Commander
                                </button>
                            </>
                        )}

                        {/* culina: search bar + cart + profile icons */}
                        {template === "culina" && (
                            <>
                                <div className="hidden md:flex items-center bg-white/10 rounded-full px-3 py-1.5 gap-2 border border-emerald-400/10">
                                    <Search className="h-4 w-4 text-zinc-400" />
                                    <input type="text" placeholder="Trouver un plat..." className="bg-transparent text-sm outline-none w-28 placeholder:text-zinc-500 text-zinc-100" />
                                </div>
                                <button
                                    onClick={openCart}
                                    className="hidden md:inline-flex relative p-2 text-zinc-300 hover:text-emerald-400 transition-colors"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-emerald-400 text-zinc-900 text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                                <button className="hidden md:inline-flex p-2 text-zinc-300 hover:text-emerald-400 transition-colors">
                                    <User className="h-5 w-5" />
                                </button>
                            </>
                        )}

                        {settings?.social_instagram && (
                            <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer"
                                className={cn(
                                    "p-2 transition-colors hidden md:block hover:text-primary",
                                    template === "bistro" || template === "elite" ? "text-zinc-300" : "text-muted-foreground",
                                    (template === "catering" || template === "foodiedash" || template === "aromabrew" || template === "culina") && "hidden"
                                )}>
                                <Instagram className="h-4 w-4" />
                            </a>
                        )}
                        {settings?.social_facebook && (
                            <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer"
                                className={cn(
                                    "p-2 transition-colors hidden md:block hover:text-primary",
                                    template === "bistro" || template === "elite" ? "text-zinc-300" : "text-muted-foreground",
                                    (template === "catering" || template === "foodiedash" || template === "aromabrew" || template === "culina") && "hidden"
                                )}>
                                <Facebook className="h-4 w-4" />
                            </a>
                        )}

                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className={cn(
                                "relative p-2 transition-colors hover:text-primary",
                                (template === "bistro" || template === "elite" || template === "aromabrew" || template === "culina") ? "text-zinc-300" : "text-muted-foreground",
                                (template === "catering" || template === "foodiedash") && "hidden"
                            )}
                            aria-label="Changer le thème"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute top-2 left-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </button>

                        {/* Cart icon */}
                        <button
                            onClick={openCart}
                            className={cn(
                                "relative p-2 transition-colors hover:text-primary",
                                (template === "bistro" || template === "elite") ? "text-zinc-300" : "text-muted-foreground",
                                template === "catering" && "md:hidden text-emerald-700",
                                template === "foodiedash" && "text-[#f27f0d]",
                                template === "aromabrew" && "text-[#f4c025]",
                                template === "culina" && "md:hidden text-emerald-400"
                            )}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className={cn(
                                    "absolute top-0.5 right-0.5 h-4 w-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in",
                                    template === "foodiedash" ? "bg-[#f27f0d]" :
                                    template === "aromabrew" ? "bg-[#f4c025] text-zinc-900" :
                                    template === "culina" ? "bg-emerald-400 text-zinc-900" :
                                    "bg-primary"
                                )}>
                                    {cartCount}
                                </span>
                            )}
                        </button>

                    </div>
                </div>
            </header>

        </>
    );
}
