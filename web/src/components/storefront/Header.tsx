"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { useState, useEffect } from "react";
import { Instagram, Facebook, Menu, X, ShoppingCart, Sun, Moon } from "lucide-react";
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
    const [mobileOpen, setMobileOpen] = useState(false);
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
        setMobileOpen(false);
    };

    return (
        <>
            <header className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                template === "classic" && "bg-background/95 backdrop-blur-md border-b border-border",
                template === "bistro" && "bg-zinc-950/90 backdrop-blur-md border-b border-white/10 text-zinc-100",
                template === "catering" && "bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm",
                template === "restaurant" && "bg-gradient-to-r from-rose-50/95 to-orange-50/95 backdrop-blur-md border-b border-rose-100",
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
                        ) : (
                            <LogoMark size="md" />
                        )}
                        <span className={cn(
                            "font-serif font-bold text-xl tracking-tight transition-colors",
                            template === "bistro" ? "text-zinc-100" : "text-foreground"
                        )}>
                            {orgName}<span className="text-primary">.</span>
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
                                    activeSection === anchor
                                        ? template === "catering"
                                            ? "bg-emerald-700 text-white shadow-sm"
                                            : "bg-primary text-primary-foreground shadow-sm"
                                        : template === "bistro"
                                            ? "text-zinc-300 hover:text-white hover:bg-white/10"
                                            : template === "catering"
                                                ? "text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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

                        {settings?.social_instagram && (
                            <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer"
                                className={cn(
                                    "p-2 transition-colors hidden md:block hover:text-primary",
                                    template === "bistro" ? "text-zinc-300" : "text-muted-foreground",
                                    template === "catering" && "hidden"
                                )}>
                                <Instagram className="h-4 w-4" />
                            </a>
                        )}
                        {settings?.social_facebook && (
                            <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer"
                                className={cn(
                                    "p-2 transition-colors hidden md:block hover:text-primary",
                                    template === "bistro" ? "text-zinc-300" : "text-muted-foreground",
                                    template === "catering" && "hidden"
                                )}>
                                <Facebook className="h-4 w-4" />
                            </a>
                        )}

                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className={cn(
                                "relative p-2 transition-colors hover:text-primary",
                                template === "bistro" ? "text-zinc-300" : "text-muted-foreground",
                                template === "catering" && "hidden"
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
                                template === "bistro" ? "text-zinc-300" : "text-muted-foreground",
                                template === "catering" && "md:hidden text-emerald-700"
                            )}
                        >
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen((o) => !o)}
                            className={cn(
                                "md:hidden p-2 transition-colors",
                                template === "bistro" ? "text-zinc-100" : "text-foreground"
                            )}
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className={cn(
                    "fixed inset-0 z-40 flex flex-col pt-20 px-6 animate-in slide-in-from-top-2 duration-200",
                    template === "bistro"
                        ? "bg-zinc-950 text-zinc-100"
                        : template === "catering"
                            ? "bg-[#f4f8f3]"
                            : "bg-background"
                )}>
                    {enabledSections.map(({ anchor, label }) => (
                        <button
                            key={anchor}
                            onClick={() => scrollTo(anchor)}
                            className={cn(
                                "py-4 text-left text-lg font-medium border-b transition-colors",
                                template === "bistro"
                                    ? "border-white/10 text-zinc-100 hover:text-primary"
                                    : "border-border text-foreground hover:text-primary"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
