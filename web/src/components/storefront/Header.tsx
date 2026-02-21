"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import { useState, useEffect } from "react";
import { ChefHat, Instagram, Facebook, Twitter, Menu, X, ShoppingCart, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StorefrontSection } from "@/lib/storefront-types";
import { useCart } from "@/context/CartContext";
import { useTheme } from "next-themes";

interface StorefrontHeaderProps {
    orgName: string;
    settings?: any;
    sections: StorefrontSection[];
}

export function StorefrontHeader({ orgName, settings, sections }: StorefrontHeaderProps) {
    const logoUrl = settings?.logo_url;
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("hero");
    const pathname = usePathname();
    const { items, openCart } = useCart();
    const { theme, setTheme } = useTheme();

    const cartCount = items.reduce((s, i) => s + i.quantity, 0);

    const enabledSections = sections.filter((s) => s.enabled);

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
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/95 backdrop-blur-md border-b border-border",
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
                            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                                <ChefHat className="h-5 w-5 text-primary" />
                            </div>
                        )}
                        <span className="font-serif font-bold text-xl tracking-tight text-foreground transition-colors">
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
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {settings?.social_instagram && (
                            <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer"
                                className="p-2 transition-colors hidden md:block text-muted-foreground hover:text-primary">
                                <Instagram className="h-4 w-4" />
                            </a>
                        )}
                        {settings?.social_facebook && (
                            <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer"
                                className="p-2 transition-colors hidden md:block text-muted-foreground hover:text-primary">
                                <Facebook className="h-4 w-4" />
                            </a>
                        )}

                        {/* Theme toggle */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="relative p-2 transition-colors text-muted-foreground hover:text-primary"
                            aria-label="Changer le thème"
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute top-2 left-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </button>

                        {/* Cart icon */}
                        <button
                            onClick={openCart}
                            className="relative p-2 transition-colors text-muted-foreground hover:text-primary"
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
                            className="md:hidden p-2 transition-colors text-foreground"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-background flex flex-col pt-20 px-6 animate-in slide-in-from-top-2 duration-200">
                    {enabledSections.map(({ anchor, label }) => (
                        <button
                            key={anchor}
                            onClick={() => scrollTo(anchor)}
                            className="py-4 text-left text-lg font-medium border-b border-border text-foreground hover:text-primary transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
