import { MapPin, Navigation } from "lucide-react";

export function LocationWidget({ address }: { address: string }) {
    return (
        <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
            <div className="relative h-32 bg-muted">
                {/* Embed Google Map or Simple Image */}
                <iframe
                    className="w-full h-full object-cover opacity-80"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&q=${encodeURIComponent(address || "Dakar")}`}
                    title="Carte"
                ></iframe>
                {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <MapPin className="h-8 w-8 text-muted-foreground opacity-50" />
                    </div>
                )}
            </div>
            <div className="p-4">
                <h4 className="font-serif font-bold text-lg mb-1">Visitez-nous</h4>
                <p className="text-sm text-muted-foreground">{address || "Adresse non définie"}</p>
                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || "Dakar")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary font-semibold mt-2 hover:underline"
                >
                    <Navigation className="h-3 w-3" /> Itinéraire
                </a>
            </div>
        </div>
    );
}
