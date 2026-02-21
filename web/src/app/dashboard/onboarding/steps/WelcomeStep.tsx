"use client";

import { LogoMark } from "@/components/Logo";
import { ArrowRight, Sparkles, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
    onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center space-y-8 py-12 max-w-lg mx-auto">
            {/* Logo with pulsing glow */}
            <div className="relative">
                <div
                    className="absolute inset-0 rounded-full bg-primary/30 blur-2xl"
                    style={{ animation: "onboarding-glow 3s ease-in-out infinite" }}
                />
                <div className="relative" style={{ animation: "onboarding-float 4s ease-in-out infinite" }}>
                    <LogoMark size="lg" />
                </div>
            </div>

            {/* Title with staggered fade-in */}
            <div className="space-y-3">
                <h1
                    className="text-4xl md:text-5xl font-serif font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                    style={{ animationDelay: "300ms" }}
                >
                    Restaurant<span className="text-primary">OS</span>
                </h1>
                <p
                    className="text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                    style={{ animationDelay: "600ms" }}
                >
                    Votre cuisine, numérisée avec la Teranga
                </p>
            </div>

            {/* Decorative floating elements */}
            <div className="relative w-full h-12">
                <Sparkles
                    className="absolute left-[15%] top-0 h-5 w-5 text-primary/40"
                    style={{ animation: "onboarding-float 3s ease-in-out infinite", animationDelay: "0s" }}
                />
                <UtensilsCrossed
                    className="absolute right-[15%] top-2 h-5 w-5 text-primary/30"
                    style={{ animation: "onboarding-float 3.5s ease-in-out infinite", animationDelay: "0.5s" }}
                />
                <Sparkles
                    className="absolute left-[50%] top-1 h-4 w-4 text-primary/20"
                    style={{ animation: "onboarding-float 4s ease-in-out infinite", animationDelay: "1s" }}
                />
            </div>

            {/* CTA button — appears last */}
            <Button
                onClick={onNext}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white px-10 h-14 rounded-full text-lg shadow-xl shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                style={{ animationDelay: "900ms" }}
            >
                Commencer l&apos;aventure
                <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
    );
}
