"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Playfair_Display, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export function Hero({ orgName, settings }: { orgName: string, settings?: any }) {
    const heroImage = settings?.hero_image || "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
    const title = settings?.hero_title || orgName;
    const subtitle = settings?.hero_subtitle || "Traiteur & Événementiel";
    const description = settings?.description || "L'art de recevoir, sublimé par des saveurs authentiques.";

    return (
        <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center text-center overflow-hidden">
            {/* Background Image (With dark overlay) */}
            <div className="absolute inset-0 bg-secondary">
                <Image
                    src={heroImage}
                    alt={title}
                    fill
                    className="object-cover opacity-60 mix-blend-overlay"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl px-6 space-y-6">
                <span className="text-white/80 font-serif tracking-widest uppercase text-sm md:text-base animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    {subtitle}
                </span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    {title}
                </h1>
                <p className="text-lg md:text-2xl text-white/90 font-light max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    {description}
                </p>
                <div className="pt-8 animate-in fade-in zoom-in duration-700 delay-500">
                    <Button
                        size="lg"
                        className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 text-lg"
                        onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}
                    >
                        Découvrir la Carte
                    </Button>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
                <ArrowDown className="h-6 w-6" />
            </div>
        </section>
    );
}
