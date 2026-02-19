import Image from "next/image";

interface AboutSectionProps {
    settings: any;
}

export function AboutSection({ settings }: AboutSectionProps) {
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
