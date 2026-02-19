import Image from "next/image";

interface GallerySectionProps {
    settings: any;
}

const PLACEHOLDER_GRADIENTS = [
    "from-amber-200 to-orange-300",
    "from-rose-200 to-pink-300",
    "from-emerald-200 to-teal-300",
    "from-violet-200 to-purple-300",
    "from-sky-200 to-blue-300",
    "from-yellow-200 to-amber-300",
];

export function GallerySection({ settings }: GallerySectionProps) {
    const title = settings?.gallery_title || "Notre Galerie";
    const subtitle = settings?.gallery_subtitle || "Des réalisations qui parlent d'elles-mêmes";
    const images: string[] = settings?.gallery_images || [];

    return (
        <section id="gallery" className="scroll-mt-24 py-16 lg:py-24">
            {/* Header */}
            <div className="text-center space-y-4 mb-14">
                <span className="text-primary font-medium tracking-widest uppercase text-xs">Galerie</span>
                <h2 className="text-4xl lg:text-5xl font-serif font-bold text-secondary">{title}</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
                <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* Masonry-like grid */}
            {images.length > 0 ? (
                <div className="columns-2 md:columns-3 gap-4 space-y-4">
                    {images.map((url, idx) => (
                        <div
                            key={idx}
                            className="break-inside-avoid relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-zoom-in"
                        >
                            <img
                                src={url}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-auto object-cover block"
                                loading="lazy"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300" />
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty state with placeholder cards */
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {PLACEHOLDER_GRADIENTS.map((gradient, i) => (
                        <div
                            key={i}
                            className={`h-48 md:h-64 rounded-2xl bg-gradient-to-br ${gradient} opacity-40 ${i === 0 ? "md:col-span-2 md:row-span-2 md:h-full" : ""}`}
                        />
                    ))}
                    <div className="col-span-2 md:col-span-3 text-center py-6 text-muted-foreground text-sm">
                        Ajoutez des photos dans les paramètres pour remplir cette galerie.
                    </div>
                </div>
            )}
        </section>
    );
}
