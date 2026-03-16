import Image from "next/image";
import { MousePointerClick, Zap, Smile, Rocket, Heart, Clock } from "lucide-react";

interface AboutSectionProps {
    settings: any;
}

export function AboutSection({ settings }: AboutSectionProps) {
    const template = settings?.storefront_template || "classic";
    const title = settings?.about_title || "Notre Histoire";
    const subtitle = settings?.about_subtitle || "Depuis 2015, une passion transmise à chaque repas";
    const text1 = settings?.about_text1 || "Née d'une passion familiale pour la gastronomie, notre maison de traiteur a été fondée avec une conviction simple : chaque repas est une occasion de créer des souvenirs. Nous mettons un point d'honneur à sélectionner les meilleurs producteurs locaux et à façonner des recettes qui allient tradition et créativité.";
    const text2 = settings?.about_text2 || "De l'apéritif au dessert, chaque détail est pensé pour sublimer votre événement. Que vous organisiez un mariage intime ou un séminaire d'entreprise, notre équipe vous accompagne de la conception du menu jusqu'au dressage de dernière minute.";
    const image = settings?.about_image || null;

    const stats: { label: string; value: string }[] = [
        { value: settings?.stat1_value || "500+", label: settings?.stat1_label || "Événements réalisés" },
        { value: settings?.stat2_value || "98%", label: settings?.stat2_label || "Clients satisfaits" },
        { value: settings?.stat3_value || "15+", label: settings?.stat3_label || "Années d'expérience" },
    ];

    if (template === "foodiedash") {
        const stepIcons = [MousePointerClick, Zap, Smile];
        const steps = [
            { Icon: stepIcons[0], label: settings?.step1_title || "Parcourez le menu", desc: settings?.step1_desc || "Explorez notre carte variée et trouvez vos plats préférés en quelques clics." },
            { Icon: stepIcons[1], label: settings?.step2_title || "Commandez en ligne", desc: settings?.step2_desc || "Passez votre commande rapidement avec un paiement simple et sécurisé." },
            { Icon: stepIcons[2], label: settings?.step3_title || "Savourez !", desc: settings?.step3_desc || "Recevez votre repas livré chaud et frais directement chez vous." },
        ];

        return (
            <section id="about" className="scroll-mt-24 py-16 lg:py-24">
                <div className="text-center space-y-3 mb-12">
                    <span className="text-primary font-semibold tracking-widest uppercase text-xs">Comment ca marche</span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-secondary">{title}</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {/* Dashed connector lines between steps (desktop only) */}
                    <div className="hidden md:block absolute top-8 left-[calc(33.33%+1rem)] right-[calc(66.66%-1rem)] border-t-2 border-dashed border-primary/30 z-0" />
                    <div className="hidden md:block absolute top-8 left-[calc(66.66%+1rem)] right-[calc(33.33%-1rem)] border-t-2 border-dashed border-primary/30 z-0" />

                    {steps.map((step, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                                i === 1
                                    ? "bg-primary text-white shadow-lg shadow-primary/30 h-20 w-20"
                                    : "bg-primary/10"
                            }`}>
                                <step.Icon className={`${i === 1 ? "h-8 w-8 text-white" : "h-7 w-7 text-primary"}`} />
                            </div>
                            <h3 className="font-bold text-lg text-secondary">{step.label}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (template === "elite") {
        return (
            <section id="about" className="scroll-mt-24 py-16 lg:py-24">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <div className="space-y-6">
                        <p className="text-primary uppercase tracking-widest text-xs font-medium">Our Story</p>
                        <h2 className="text-4xl lg:text-5xl font-serif italic font-bold text-white leading-tight">{title}</h2>
                        <div className="w-16 h-[2px] bg-primary" />
                        <p className="text-zinc-400 leading-relaxed">{text1}</p>
                        <p className="text-zinc-400 leading-relaxed">{text2}</p>

                        <div className="flex items-center gap-6 pt-4">
                            {stats.map((s, i) => (
                                <div key={s.label} className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-amber-400 font-serif">{s.value}</p>
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                                    </div>
                                    {i < stats.length - 1 && <div className="h-10 w-px bg-white/10" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Decorative corner borders */}
                        <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-primary z-10" />
                        <div className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-primary z-10" />
                        <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b-2 border-l-2 border-primary z-10" />
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-primary z-10" />

                        <div className="relative h-[400px] lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl group">
                            {image ? (
                                <Image
                                    src={image}
                                    alt={title}
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/15 to-primary/5 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-1000">
                                    <span className="text-8xl opacity-60">🍷</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (template === "aromabrew") {
        return (
            <section id="about" className="scroll-mt-24 py-16 lg:py-24">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <div className="relative h-[360px] lg:h-[460px] rounded-3xl overflow-hidden shadow-xl">
                        {image ? (
                            <Image src={image} alt={title} fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
                                <span className="text-8xl">☕</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <span className="text-primary font-medium tracking-widest uppercase text-xs">Notre Histoire</span>
                        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">{title}</h2>
                        <p className="text-lg text-zinc-400 font-medium">{subtitle}</p>
                        <div className="w-12 h-1 bg-primary rounded-full" />
                        <p className="text-zinc-400 leading-relaxed">{text1}</p>
                        <p className="text-zinc-400 leading-relaxed">{text2}</p>

                        <div className="flex gap-8 pt-4">
                            {stats.map((s) => (
                                <div key={s.label} className="text-center">
                                    <p className="text-2xl font-bold text-primary font-serif">{s.value}</p>
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (template === "culina") {
        const culinaIcons = [Rocket, Heart, Clock];
        const metricCards = [
            { Icon: culinaIcons[0], label: settings?.stat1_label || "Evenements realises", value: stats[0].value, desc: settings?.stat1_desc || "et plus chaque annee", border: "border-l-primary" },
            { Icon: culinaIcons[1], label: settings?.stat2_label || "Clients satisfaits", value: stats[1].value, desc: settings?.stat2_desc || "taux de satisfaction", border: "border-l-orange-500" },
            { Icon: culinaIcons[2], label: settings?.stat3_label || "Annees d'experience", value: stats[2].value, desc: settings?.stat3_desc || "de savoir-faire", border: "border-l-pink-500" },
        ];

        return (
            <section id="about" className="scroll-mt-24 py-16 lg:py-24">
                <div className="text-center space-y-3 mb-12">
                    <h2 className="text-3xl lg:text-4xl font-bold italic text-white">LIVE METRICS</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">{subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {metricCards.map((card) => (
                        <div
                            key={card.label}
                            className={`bg-slate-900 border border-slate-800 ${card.border} border-l-4 rounded-2xl p-6 space-y-3`}
                        >
                            <div className="flex items-center gap-3">
                                <card.Icon className="h-5 w-5 text-primary" />
                                <span className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</span>
                            </div>
                            <p className="text-4xl font-bold italic text-white">{card.value}</p>
                            <p className="text-sm text-slate-500">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (template === "catering") {
        return (
            <section id="about" className="scroll-mt-24 py-12 lg:py-16">
                <div className="rounded-[28px] border border-emerald-100 bg-[#f4f8f3] p-6 sm:p-8 lg:p-10">
                    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 items-center">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 mb-3">Chosen option in digital catalog</p>
                            <h2 className="text-4xl lg:text-5xl font-outfit font-bold text-zinc-900 leading-tight">{title}</h2>
                            <p className="text-zinc-700 text-lg mt-2 max-w-xl">{subtitle}</p>
                            <p className="text-zinc-600 leading-relaxed mt-5">{text1}</p>
                            <p className="text-zinc-600 leading-relaxed mt-3">{text2}</p>
                            <a
                                href="#contact"
                                className="inline-flex items-center mt-6 rounded-full bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-800/20"
                            >
                                Lire la suite
                            </a>
                        </div>

                        <div className="relative h-[260px] sm:h-[320px] lg:h-[360px] rounded-3xl overflow-hidden shadow-lg">
                            {image ? (
                                <Image src={image} alt={title} fill className="object-cover" />
                            ) : (
                                <Image
                                    src="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80"
                                    alt="Sandwich gourmet"
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="about" className="scroll-mt-24 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Image */}
                <div className="relative order-2 lg:order-1">
                    <div className="relative h-[420px] lg:h-[560px] rounded-3xl overflow-hidden shadow-2xl">
                        {image ? (
                            <Image src={image} alt="Notre Histoire" fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
                                <span className="text-8xl">👨‍🍳</span>
                            </div>
                        )}
                        {/* Accent overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    {/* Floating stats card */}
                    <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-white dark:bg-card rounded-2xl shadow-xl p-5 border border-border flex gap-6">
                        {stats.map((s) => (
                            <div key={s.label} className="text-center">
                                <p className="text-2xl font-bold text-primary font-serif">{s.value}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Text */}
                <div className="order-1 lg:order-2 space-y-6">
                    <div className="space-y-2">
                        <span className="text-primary font-medium tracking-widest uppercase text-xs">À propos</span>
                        <h2 className="text-4xl lg:text-5xl font-serif font-bold text-secondary leading-tight">{title}</h2>
                        <p className="text-lg text-muted-foreground font-medium">{subtitle}</p>
                    </div>

                    <div className="w-16 h-1 bg-primary rounded-full" />

                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p>{text1}</p>
                        <p>{text2}</p>
                    </div>

                    <div className="pt-4">
                        <a
                            href="#contact"
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Nous contacter →
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
