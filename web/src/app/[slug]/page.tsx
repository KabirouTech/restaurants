import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Hero } from "@/components/storefront/Hero";
import { MenuSection } from "@/components/storefront/MenuSection";
import { StorefrontHeader } from "@/components/storefront/Header";
import { StorefrontFooter } from "@/components/storefront/Footer";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CartFloatingButton } from "@/components/storefront/CartFloatingButton";
import { BookingWidget } from "@/components/storefront/BookingWidget";
import { LocationWidget } from "@/components/storefront/LocationWidget";
import { CurrentOrderWidget } from "@/components/storefront/CurrentOrderWidget";
import { ShoppingBasket } from "lucide-react";

// Force dynamic if needed, but ISR/Static is better for storefronts.
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>
};

async function getOrganization(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error || !data) return null;
    return data;
}

async function getProducts(orgId: string) {
    const supabase = await createClient();
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true);

    return products || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const org = await getOrganization(slug);
    if (!org) return { title: "Restaurant non trouvé" };

    return {
        title: `${org.name} - Carte & Menu`,
        description: `Découvrez la carte de ${org.name}. Commandez en ligne pour vos événements.`,
    };
}

// Helper to convert Hex to HSL for Tailwind variable injection
function hexToHsl(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    // Return space delimited values for Tailwind
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default async function StorefrontPage({ params }: Props) {
    const { slug } = await params;
    const org = await getOrganization(slug);

    if (!org) {
        notFound();
    }

    const products = await getProducts(org.id);
    const primaryHsl = org.settings?.primary_color ? hexToHsl(org.settings.primary_color) : null;

    return (
        <CartProvider>
            <div
                className="min-h-screen flex flex-col font-sans bg-background text-foreground selection:bg-primary/30 relative"
                style={primaryHsl ? { "--primary": primaryHsl } as React.CSSProperties : {}}
            >
                <StorefrontHeader orgName={org.name} />

                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">

                        {/* LEFT COLUMN (Content) */}
                        <div className="lg:col-span-8 space-y-12">
                            <Hero orgName={org.name} settings={org.settings} />

                            <MenuSection products={products} />
                        </div>

                        {/* RIGHT COLUMN (Sidebar) */}
                        <div className="hidden lg:block lg:col-span-4 mt-12 lg:mt-0 space-y-8 sticky top-24">
                            <BookingWidget />

                            {/* Current Order (Dynamic Cart) */}
                            <CurrentOrderWidget />

                            <LocationWidget address={org.settings?.contact_address} />
                        </div>

                    </div>
                </main>

                <StorefrontFooter orgName={org.name} settings={org.settings} />
                <CartDrawer orgId={org.id} />
                <CartFloatingButton />
            </div>
        </CartProvider>
    );
}
