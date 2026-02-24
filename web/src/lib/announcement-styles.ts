// Shared style config for announcements — used by admin form, admin client, and dashboard bar

export const announcementColors: Record<string, {
    label: string;
    bar: string;
    dot: string;
    badge: string;
    badgeText: string;
    group: "solid" | "gradient";
}> = {
    // Solid colors
    info:    { label: "Bleu",    bar: "bg-blue-500 text-white",   dot: "bg-blue-500",  badge: "bg-blue-100 dark:bg-blue-900/30", badgeText: "text-blue-700 dark:text-blue-400", group: "solid" },
    warning: { label: "Ambre",   bar: "bg-amber-500 text-white",  dot: "bg-amber-500", badge: "bg-amber-100 dark:bg-amber-900/30", badgeText: "text-amber-700 dark:text-amber-400", group: "solid" },
    success: { label: "Vert",    bar: "bg-green-500 text-white",  dot: "bg-green-500", badge: "bg-green-100 dark:bg-green-900/30", badgeText: "text-green-700 dark:text-green-400", group: "solid" },
    error:   { label: "Rouge",   bar: "bg-red-500 text-white",    dot: "bg-red-500",   badge: "bg-red-100 dark:bg-red-900/30", badgeText: "text-red-700 dark:text-red-400", group: "solid" },
    purple:  { label: "Violet",  bar: "bg-purple-500 text-white", dot: "bg-purple-500", badge: "bg-purple-100 dark:bg-purple-900/30", badgeText: "text-purple-700 dark:text-purple-400", group: "solid" },
    pink:    { label: "Rose",    bar: "bg-pink-500 text-white",   dot: "bg-pink-500",  badge: "bg-pink-100 dark:bg-pink-900/30", badgeText: "text-pink-700 dark:text-pink-400", group: "solid" },
    teal:    { label: "Sarcelle", bar: "bg-teal-500 text-white",  dot: "bg-teal-500",  badge: "bg-teal-100 dark:bg-teal-900/30", badgeText: "text-teal-700 dark:text-teal-400", group: "solid" },
    dark:    { label: "Sombre",  bar: "bg-gray-900 text-white dark:bg-gray-800", dot: "bg-gray-900 dark:bg-gray-600", badge: "bg-gray-100 dark:bg-gray-800", badgeText: "text-gray-700 dark:text-gray-300", group: "solid" },
    // Gradients
    "gradient-sunset": { label: "Coucher de soleil", bar: "bg-gradient-to-r from-orange-500 to-pink-500 text-white", dot: "bg-gradient-to-r from-orange-500 to-pink-500", badge: "bg-orange-100 dark:bg-orange-900/30", badgeText: "text-orange-700 dark:text-orange-400", group: "gradient" },
    "gradient-ocean":  { label: "Océan",  bar: "bg-gradient-to-r from-blue-500 to-teal-400 text-white", dot: "bg-gradient-to-r from-blue-500 to-teal-400", badge: "bg-blue-100 dark:bg-blue-900/30", badgeText: "text-blue-700 dark:text-blue-400", group: "gradient" },
    "gradient-royal":  { label: "Royal",  bar: "bg-gradient-to-r from-purple-600 to-blue-500 text-white", dot: "bg-gradient-to-r from-purple-600 to-blue-500", badge: "bg-purple-100 dark:bg-purple-900/30", badgeText: "text-purple-700 dark:text-purple-400", group: "gradient" },
    "gradient-emerald": { label: "Emeraude", bar: "bg-gradient-to-r from-emerald-500 to-teal-400 text-white", dot: "bg-gradient-to-r from-emerald-500 to-teal-400", badge: "bg-emerald-100 dark:bg-emerald-900/30", badgeText: "text-emerald-700 dark:text-emerald-400", group: "gradient" },
};

export const announcementPositions: { value: string; label: string; description: string }[] = [
    { value: "top",         label: "Haut",        description: "En haut du dashboard" },
    { value: "bottom",      label: "Bas",         description: "Fixé en bas de l'écran" },
    { value: "floating-br", label: "Flottant ↘",  description: "Coin bas-droit" },
    { value: "floating-bl", label: "Flottant ↙",  description: "Coin bas-gauche" },
];

export const announcementFormats: { value: string; label: string; description: string }[] = [
    { value: "bar",    label: "Barre",    description: "Bande pleine largeur" },
    { value: "banner", label: "Bannière", description: "Arrondi avec marges" },
    { value: "card",   label: "Carte",    description: "Carte compacte avec ombre" },
    { value: "popup",  label: "Popup",    description: "Modal centré" },
];

export function getFormatClasses(format: string | null | undefined): string {
    switch (format) {
        case "banner": return "rounded-xl mx-4 my-2 shadow-md";
        case "card":   return "rounded-xl shadow-lg max-w-md mx-auto my-2";
        case "popup":  return "rounded-2xl shadow-2xl max-w-lg mx-auto";
        default:       return ""; // bar = full width, no extra classes
    }
}

export function getPositionClasses(position: string | null | undefined): string {
    switch (position) {
        case "bottom":      return "fixed bottom-0 left-0 right-0 z-50";
        case "floating-br": return "fixed bottom-4 right-4 z-50 max-w-sm";
        case "floating-bl": return "fixed bottom-4 left-4 z-50 max-w-sm";
        default:            return ""; // top = in flow
    }
}

export const announcementAnimations: { value: string; label: string; description: string }[] = [
    { value: "none",    label: "Aucune",   description: "Pas d'animation" },
    { value: "pulse",   label: "Pulse",    description: "Pulsation subtile" },
    { value: "shimmer", label: "Shimmer",  description: "Effet de brillance" },
    { value: "slide",   label: "Slide",    description: "Glissement depuis le haut" },
    { value: "glow",    label: "Glow",     description: "Lueur pulsante" },
    { value: "rainbow", label: "Rainbow",  description: "Bordure arc-en-ciel" },
];

export function getAnimationClass(animation: string | null | undefined, position?: string | null): string {
    switch (animation) {
        case "pulse":   return "animate-banner-pulse";
        case "shimmer": return "animate-banner-shimmer bg-[length:200%_100%]";
        case "slide": {
            const fromBottom = position === "bottom" || position === "floating-br" || position === "floating-bl";
            return fromBottom ? "animate-banner-slide-up" : "animate-banner-slide";
        }
        case "glow":    return "animate-banner-glow";
        case "rainbow": return "animate-banner-rainbow border-b-2 border-t-2";
        default:        return "";
    }
}

export function getBarStyle(type: string): string {
    return announcementColors[type]?.bar || announcementColors.info.bar;
}
