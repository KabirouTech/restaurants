import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/storefront-types";
import { DEFAULT_TESTIMONIALS } from "@/lib/storefront-types";

interface TestimonialsSectionProps {
    settings: any;
}

export function TestimonialsSection({ settings }: TestimonialsSectionProps) {
    const template = settings?.storefront_template || "classic";
    const title = settings?.testimonials_title || "Ce que disent nos clients";
    const subtitle = settings?.testimonials_subtitle || "Des centaines d'événements, autant de sourires";
    const testimonials: Testimonial[] = (settings?.testimonials && settings.testimonials.length > 0)
        ? settings.testimonials
        : DEFAULT_TESTIMONIALS;

    if (template === "foodiedash") {
        return (
            <section id="testimonials" className="scroll-mt-24 py-16 lg:py-24">
                <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] px-6 lg:px-12 py-14">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-[100px]" />
                    <div className="relative text-center space-y-3 mb-12">
                        <span className="text-primary font-semibold tracking-widest uppercase text-xs">Temoignages</span>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white">{title}</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">{subtitle}</p>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div
                                key={t.id}
                                className={`rounded-2xl p-6 space-y-4 transition-all duration-300 hover:-translate-y-1 ${
                                    i === 1
                                        ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/20 scale-[1.02]"
                                        : "bg-white/10 backdrop-blur text-white"
                                }`}
                            >
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, si) => (
                                        <Star
                                            key={si}
                                            className="h-4 w-4"
                                            fill={si < t.rating ? "currentColor" : "none"}
                                            style={{
                                                color: si < t.rating
                                                    ? i === 1 ? "white" : "hsl(var(--primary))"
                                                    : "rgba(255,255,255,0.2)",
                                            }}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm leading-relaxed italic">"{t.text}"</p>
                                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                        i === 1 ? "bg-white/20" : "bg-primary/20 text-primary"
                                    }`}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{t.name}</p>
                                        <p className={`text-xs ${i === 1 ? "text-white/70" : "text-slate-400"}`}>{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (template === "elite") {
        const featured = testimonials[0];

        return (
            <section id="testimonials" className="scroll-mt-24 py-16 lg:py-24">
                <div className="max-w-3xl mx-auto text-center space-y-8">
                    <span className="text-primary font-medium tracking-widest uppercase text-xs">Temoignages</span>

                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-16 bg-white/10" />
                        <div className="text-primary text-6xl font-serif leading-none">&ldquo;</div>
                        <div className="h-px w-16 bg-white/10" />
                    </div>

                    <p className="text-xl lg:text-2xl font-serif italic text-white leading-relaxed">
                        {featured.text}
                    </p>

                    <div className="flex flex-col items-center gap-3 pt-4">
                        <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
                            {featured.name[0]}
                        </div>
                        <div>
                            <p className="font-semibold text-white">{featured.name}</p>
                            <p className="text-sm text-zinc-400">{featured.role}</p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (template === "aromabrew") {
        return (
            <section id="testimonials" className="scroll-mt-24 py-16 lg:py-24">
                <div className="text-center space-y-3 mb-12">
                    <span className="text-primary font-medium tracking-widest uppercase text-xs">Temoignages</span>
                    <h2 className="text-3xl lg:text-4xl font-serif font-bold text-white">{title}</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">{subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {testimonials.map((t) => (
                        <div
                            key={t.id}
                            className="bg-[#2a2418] border border-[#f4c025]/10 rounded-[2rem] p-6 space-y-4 hover:border-[#f4c025]/25 hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4"
                                        fill={i < t.rating ? "currentColor" : "none"}
                                        style={{ color: i < t.rating ? "#f4c025" : "rgba(255,255,255,0.1)" }}
                                    />
                                ))}
                            </div>
                            <p className="text-zinc-300 text-sm leading-relaxed italic">"{t.text}"</p>
                            <div className="flex items-center gap-3 pt-2">
                                <div className="h-10 w-10 rounded-full bg-[#f4c025]/15 flex items-center justify-center text-[#f4c025] font-bold text-sm">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-white">{t.name}</p>
                                    <p className="text-xs text-zinc-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (template === "culina") {
        return (
            <section id="testimonials" className="relative scroll-mt-24 py-16 lg:py-24">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative text-center space-y-3 mb-12">
                    <span className="text-primary font-medium tracking-widest uppercase text-xs">Temoignages</span>
                    <h2 className="text-3xl lg:text-4xl font-bold italic text-white">{title}</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">{subtitle}</p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div
                            key={t.id}
                            className="bg-slate-900/80 backdrop-blur border border-slate-800 hover:border-primary/40 rounded-2xl p-6 space-y-4 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4"
                                        fill={i < t.rating ? "currentColor" : "none"}
                                        style={{ color: i < t.rating ? "hsl(var(--primary))" : "rgba(255,255,255,0.1)" }}
                                    />
                                ))}
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed font-bold italic">"{t.text}"</p>
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-white">{t.name}</p>
                                    <p className="text-xs text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section id="testimonials" className="scroll-mt-24 py-16 lg:py-24 bg-secondary/5 rounded-3xl px-6 lg:px-12">
            {/* Header */}
            <div className="text-center space-y-4 mb-14">
                <span className="text-primary font-medium tracking-widest uppercase text-xs">Témoignages</span>
                <h2 className="text-4xl lg:text-5xl font-serif font-bold text-secondary">{title}</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
                <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.map((t) => (
                    <div
                        key={t.id}
                        className="bg-background border border-border/50 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >
                        {/* Stars */}
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className="h-4 w-4"
                                    fill={i < t.rating ? "currentColor" : "none"}
                                    style={{ color: i < t.rating ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                                />
                            ))}
                        </div>

                        {/* Quote */}
                        <p className="text-muted-foreground text-sm leading-relaxed italic">"{t.text}"</p>

                        {/* Author */}
                        <div className="flex items-center gap-3 pt-2 border-t border-border">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {t.name[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-secondary">{t.name}</p>
                                <p className="text-xs text-muted-foreground">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
