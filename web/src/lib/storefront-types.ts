// Shared types and defaults for storefront sections
export interface StorefrontSection {
    id: string;
    label: string;
    enabled: boolean;
    anchor: string;
}

export const DEFAULT_SECTIONS: StorefrontSection[] = [
    { id: "menu", label: "Notre Carte", enabled: true, anchor: "menu" },
    { id: "about", label: "Notre Histoire", enabled: true, anchor: "about" },
    { id: "services", label: "Événements", enabled: true, anchor: "services" },
    { id: "gallery", label: "Galerie", enabled: false, anchor: "gallery" },
    { id: "testimonials", label: "Témoignages", enabled: false, anchor: "testimonials" },
    { id: "contact", label: "Contact", enabled: true, anchor: "contact" },
];

export interface ServiceItem {
    id: string;
    emoji: string;
    title: string;
    description: string;
}

export const DEFAULT_SERVICES: ServiceItem[] = [
    { id: "1", emoji: "🎂", title: "Anniversaires", description: "Gâteaux personnalisés et buffets sur mesure pour des célébrations inoubliables." },
    { id: "2", emoji: "💍", title: "Mariages", description: "Menus gastronomiques et cocktails dînatoires pour le plus beau jour de votre vie." },
    { id: "3", emoji: "🏢", title: "Séminaires & Corporate", description: "Plateaux repas et cocktails déjeunatoires pour animer vos événements professionnels." },
    { id: "4", emoji: "🎉", title: "Fêtes & Réceptions", description: "Traiteur clé en main pour toutes vos occasions : baptêmes, EVJF, soirées thématiques." },
];

export interface Testimonial {
    id: string;
    name: string;
    role: string;
    text: string;
    rating: number;
}

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
    { id: "1", name: "Sophie M.", role: "Mariée, juin 2024", text: "Un service impeccable du début à la fin. Les invités ont adoré chaque plat, plusieurs nous ont demandé le contact du traiteur !", rating: 5 },
    { id: "2", name: "Karim B.", role: "Directeur RH", text: "Notre séminaire annuel a été transformé grâce à leur équipe. Professionnel, ponctuel et délicieux.", rating: 5 },
    { id: "3", name: "Isabelle L.", role: "Anniversaire 50 ans", text: "Tout le monde a été bluffé. La présentation des plateaux était magnifique et les saveurs au rendez-vous.", rating: 5 },
];
