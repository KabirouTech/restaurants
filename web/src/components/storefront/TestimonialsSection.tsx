import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/storefront-types";
import { DEFAULT_TESTIMONIALS } from "@/lib/storefront-types";

interface TestimonialsSectionProps {
    settings: any;
}

export function TestimonialsSection({ settings }: TestimonialsSectionProps) {
    const title = settings?.testimonials_title || "Ce que disent nos clients";
    const subtitle = settings?.testimonials_subtitle || "Des centaines d'événements, autant de sourires";
    const testimonials: Testimonial[] = (settings?.testimonials && settings.testimonials.length > 0)
        ? settings.testimonials
        : DEFAULT_TESTIMONIALS;

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
                                    style={{ color: i < t.rating ? "var(--primary)" : "#d1d5db" }}
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
