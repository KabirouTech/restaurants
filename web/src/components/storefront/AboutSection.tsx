import Image from "next/image";

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
