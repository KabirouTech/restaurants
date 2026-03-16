"use client";

import { useState, useEffect } from "react";
import { Home, UtensilsCrossed, Info, MessageSquare, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import type { StorefrontTemplate } from "@/lib/storefront-templates";

interface MobileBottomNavProps {
    template?: StorefrontTemplate;
}

const NAV_ITEMS = [
    { id: "hero", anchor: "hero", label: "Accueil", icon: Home, scrollTop: true },
    { id: "menu", anchor: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "about", anchor: "about", label: "A propos", icon: Info },
    { id: "contact", anchor: "contact", label: "Contact", icon: MessageSquare },
];

export function MobileBottomNav({ template = "classic" }: MobileBottomNavProps) {
    const [activeSection, setActiveSection] = useState("hero");
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const { items, totalCents, openCart } = useCart();
    const cartCount = items.reduce((s, i) => s + i.quantity, 0);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setVisible(y < 100 || y < lastScrollY);
            setLastScrollY(y);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [lastScrollY]);

    // Track active section
    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        NAV_ITEMS.forEach(({ anchor }) => {
            const el = document.getElementById(anchor);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(anchor); },
                { rootMargin: "-30% 0px -60% 0px" }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, []);

    const scrollTo = (anchor: string, scrollTop?: boolean) => {
        if (scrollTop) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        const el = document.getElementById(anchor);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    // Format price in FCFA
    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat("fr-FR").format(Math.round(cents / 100)) + " F";
    };

    // Template-specific colors
    const getActiveColor = () => {
        switch (template) {
            case "foodiedash": return "text-[#f27f0d]";
            case "elite": return "text-amber-400";
            case "aromabrew": return "text-[#f4c025]";
            case "culina": return "text-emerald-400";
            case "catering": return "text-emerald-600";
            default: return "text-primary";
        }
    };

    const getInactiveColor = () => {
        switch (template) {
            case "bistro":
            case "elite":
            case "aromabrew":
            case "culina": return "text-zinc-500";
            default: return "text-muted-foreground";
        }
    };

    const getBgClass = () => {
        switch (template) {
            case "bistro": return "bg-zinc-950/95 border-white/10";
            case "elite": return "bg-[#120d0b]/95 border-white/10";
            case "aromabrew": return "bg-[#221e10]/95 border-yellow-500/10";
            case "culina": return "bg-[#10221d]/95 border-emerald-400/10";
            case "foodiedash": return "bg-white/95 border-orange-100";
            case "catering": return "bg-white/95 border-emerald-100";
            default: return "bg-background/95 border-border";
        }
    };

    const getCartBadgeColor = () => {
        switch (template) {
            case "foodiedash": return "bg-[#f27f0d] text-white";
            case "aromabrew": return "bg-[#f4c025] text-zinc-900";
            case "culina": return "bg-emerald-400 text-zinc-900";
            default: return "bg-primary text-primary-foreground";
        }
    };

    const getActiveDotColor = () => {
        switch (template) {
            case "foodiedash": return "bg-[#f27f0d]";
            case "elite": return "bg-amber-400";
            case "aromabrew": return "bg-[#f4c025]";
            case "culina": return "bg-emerald-400";
            case "catering": return "bg-emerald-600";
            default: return "bg-primary";
        }
    };

    const getCartSummaryStyle = () => {
        switch (template) {
            case "foodiedash": return "bg-[#f27f0d] text-white";
            case "elite": return "bg-amber-500 text-white";
            case "aromabrew": return "bg-[#f4c025] text-zinc-900";
            case "culina": return "bg-emerald-500 text-white";
            default: return "bg-primary text-primary-foreground";
        }
    };

    return (
        <div
            className={cn(
                "md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300",
                visible ? "translate-y-0" : "translate-y-full"
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            {/* Cart summary bar — shown above nav when cart has items */}
            {cartCount > 0 && (
                <button
                    onClick={openCart}
                    className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors",
                        getCartSummaryStyle()
                    )}
                >
                    <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-5 min-w-5 px-1 text-[11px] font-bold rounded-full bg-white/25">
                            {cartCount}
                        </span>
                        <span>Voir ma commande</span>
                    </div>
                    <span className="font-bold">{formatPrice(totalCents)}</span>
                </button>
            )}

            {/* Navigation bar */}
            <div
                className={cn(
                    "border-t backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.08)]",
                    getBgClass()
                )}
            >
                <div className="flex items-center justify-around h-[4.25rem] px-1">
                    {NAV_ITEMS.map(({ id, anchor, label, icon: Icon, scrollTop }) => {
                        const isActive = activeSection === anchor;
                        return (
                            <button
                                key={id}
                                onClick={() => scrollTo(anchor, scrollTop)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[3rem] py-1.5 transition-colors relative active:scale-95",
                                    isActive ? getActiveColor() : getInactiveColor()
                                )}
                            >
                                <Icon className={cn("h-[22px] w-[22px] transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 1.8} />
                                <span className="text-[11px] font-medium leading-tight">{label}</span>
                                {isActive && (
                                    <div className={cn("absolute -top-0.5 w-5 h-0.5 rounded-full", getActiveDotColor())} />
                                )}
                            </button>
                        );
                    })}

                    {/* Cart button */}
                    <button
                        onClick={openCart}
                        className={cn(
                            "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[3rem] py-1.5 transition-colors relative active:scale-95",
                            getInactiveColor()
                        )}
                    >
                        <div className="relative">
                            <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={1.8} />
                            {cartCount > 0 && (
                                <span className={cn(
                                    "absolute -top-1.5 -right-2.5 h-4 min-w-4 px-0.5 text-[9px] font-bold rounded-full flex items-center justify-center",
                                    getCartBadgeColor()
                                )}>
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[11px] font-medium leading-tight">Panier</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
