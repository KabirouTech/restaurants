"use client";

import { Rocket, User, Utensils, ChefHat, Coins, Palette } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { useMemo } from "react";

interface LaunchStepProps {
    formData: {
        fullName: string;
        orgName: string;
        orgDescription: string;
        currency: string;
        primaryColor: string;
        services: { name: string; loadCost: number; color: string }[];
        menuItems: { name: string; description: string; price: string; category: string }[];
        servicesSkipped: boolean;
        menuSkipped: boolean;
    };
    loading: boolean;
    success: boolean;
}

const CONFETTI_COLORS = [
    "#e67e22", // orange
    "#8B4513", // brown
    "#f0c040", // gold
    "#14b8a6", // teal
    "#f43f5e", // rose
    "#fde8c8", // cream
];

function ConfettiParticles() {
    const particles = useMemo(() => {
        return Array.from({ length: 40 }, (_, i) => {
            const left = Math.random() * 100;
            const size = 6 + Math.random() * 10;
            const delay = Math.random() * 1.5;
            const duration = 2 + Math.random() * 2;
            const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
            const borderRadius = Math.random() > 0.5 ? "50%" : `${Math.random() * 4}px`;
            return { i, left, size, delay, duration, color, borderRadius };
        });
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((p) => (
                <div
                    key={p.i}
                    className="absolute"
                    style={{
                        left: `${p.left}%`,
                        top: 0,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: p.borderRadius,
                        animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s both, confetti-sway ${p.duration * 0.5}s ease-in-out ${p.delay}s infinite`,
                    }}
                />
            ))}
        </div>
    );
}

export function LaunchStep({ formData, loading, success }: LaunchStepProps) {
    return (
        <div className="space-y-8 max-w-lg mx-auto text-center py-8">
            {/* Heading */}
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-primary border border-primary/20 mx-auto">
                    <Rocket className="h-7 w-7" />
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    {success ? `Bienvenue, ${formData.orgName} !` : "Prêt à démarrer !"}
                </h2>
            </div>

            {/* Summary card */}
            <div
                className={`relative rounded-2xl border border-border bg-card p-6 text-left space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both ${loading ? "overflow-hidden" : ""}`}
                style={{ animationDelay: "200ms" }}
            >
                {/* Shimmer overlay when loading */}
                {loading && (
                    <div
                        className="absolute inset-0 z-10"
                        style={{
                            background: "linear-gradient(90deg, transparent 30%, hsl(var(--primary) / 0.08) 50%, transparent 70%)",
                            backgroundSize: "200% 100%",
                            animation: "onboarding-shimmer 1.5s ease-in-out infinite",
                        }}
                    />
                )}

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Chef</p>
                        <p className="font-medium text-foreground">{formData.fullName || "Non spécifié"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coins className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Devise</p>
                        <p className="font-medium text-foreground">
                            {CURRENCIES.find((c) => c.code === formData.currency)?.label || formData.currency}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Palette className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Couleur de marque</p>
                            <p className="font-medium text-foreground">{formData.primaryColor}</p>
                        </div>
                        <div
                            className="h-6 w-6 rounded-full border border-border shadow-sm"
                            style={{ backgroundColor: formData.primaryColor }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Utensils className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Services</p>
                        <p className="font-medium text-foreground">
                            {formData.servicesSkipped
                                ? `${formData.services.length} services (par défaut)`
                                : `${formData.services.length} services`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <ChefHat className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Menu</p>
                        <p className="font-medium text-foreground">
                            {formData.menuSkipped
                                ? `${formData.menuItems.length} plat (par défaut)`
                                : `${formData.menuItems.length} plat${formData.menuItems.length > 1 ? "s" : ""}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading / Success states */}
            {loading && (
                <p className="text-muted-foreground animate-pulse">
                    Création de votre cuisine...
                </p>
            )}

            {success && <ConfettiParticles />}
        </div>
    );
}
