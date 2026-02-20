import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Hero } from "@/components/storefront/Hero";
import { MenuSection } from "@/components/storefront/MenuSection";
import { AboutSection } from "@/components/storefront/AboutSection";
import { ServicesSection } from "@/components/storefront/ServicesSection";
import { GallerySection } from "@/components/storefront/GallerySection";
import { TestimonialsSection } from "@/components/storefront/TestimonialsSection";
import { ContactSection } from "@/components/storefront/ContactSection";
import { StorefrontHeader } from "@/components/storefront/Header";
import { StorefrontFooter } from "@/components/storefront/Footer";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CartFloatingButton } from "@/components/storefront/CartFloatingButton";
import { DEFAULT_SECTIONS } from "@/lib/storefront-types";
import type { StorefrontSection } from "@/lib/storefront-types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

async function getOrganization(slug: string) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
        .from("organizations").select("*").eq("slug", slug).single();
    if (error || !data) return null;
    return data;
}

async function getProducts(orgId: string) {
    const supabase = getAdminClient();
    const { data } = await supabase
        .from("products").select("*")
        .eq("organization_id", orgId)
        .eq("is_active", true);
    return data || [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const org = await getOrganization(slug);
    if (!org) return { title: "Restaurant non trouvé" };
    const s = (org.settings || {}) as Record<string, any>;

    return {
        title: s.meta_title || `${org.name} – Carte & Événements`,
        description: s.meta_description || s.description ||
            `Découvrez la carte de ${org.name}. Traiteur, événements et commandes en ligne.`,
        openGraph: {
            title: s.meta_title || org.name,
            description: s.meta_description || s.description,
            images: s.hero_image ? [{ url: s.hero_image }] : [],
        },
    };
}

function hexToHsl(hex: string): string | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
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
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<{ settings: any; products?: any[] }>> = {
    about: AbouWrap,
    services: ServicesWrap,
    gallery: GalleryWrap,
    testimonials: TestimonialsWrap,
    contact: ContactWrap,
};

// Thin wrappers to match generic signature
function AbouWrap({ settings }: { settings: any }) { return <AboutSection settings={settings} />; }
function ServicesWrap({ settings }: { settings: any }) { return <ServicesSection settings={settings} />; }
function GalleryWrap({ settings }: { settings: any }) { return <GallerySection settings={settings} />; }
function TestimonialsWrap({ settings }: { settings: any }) { return <TestimonialsSection settings={settings} />; }
function ContactWrap({ settings }: { settings: any }) { return <ContactSection settings={settings} />; }

export default async function StorefrontPage({ params }: Props) {
    const { slug } = await params;
    const org = await getOrganization(slug);
    if (!org) notFound();

    const products = await getProducts(org.id);
    const s = (org.settings || {}) as Record<string, any>;
    const primaryHsl = s.primary_color ? hexToHsl(s.primary_color) : null;
    const currency = s.currency || "EUR";

    // Resolve sections: merge saved config with defaults so new defaults appear
    const savedSections: StorefrontSection[] = s.sections || [];
    const sections: StorefrontSection[] = DEFAULT_SECTIONS.map((def) => {
        const saved = savedSections.find((sec) => sec.id === def.id);
        return saved ? { ...def, ...saved } : def;
    });

    const enabledSections = sections.filter((sec) => sec.enabled);

    // Enrich settings with org_id so client components (e.g. ContactSection) can use it
    const settingsWithOrgId = { ...(org.settings || {}), org_id: org.id };


    return (
        <CartProvider>
            <div
                className="min-h-screen flex flex-col font-sans bg-background text-foreground selection:bg-primary/30"
                style={primaryHsl ? { "--primary": primaryHsl } as React.CSSProperties : {}}
            >
                <StorefrontHeader orgName={org.name} settings={org.settings} sections={sections} />

                {/* Hero — constrained with side margins, not full-bleed */}
                <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-4">
                    <Hero orgName={org.name} settings={org.settings} />
                </div>


                {/* Dynamic sections */}
                <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-0 divide-y divide-border/30">
                    {/* Menu is always present */}
                    <div className="py-0">
                        <MenuSection products={products} currency={currency} />
                    </div>

                    {/* Remaining enabled sections */}
                    {enabledSections
                        .filter((sec) => sec.id !== "menu")
                        .map((sec) => {
                            const Component = SECTION_COMPONENTS[sec.id];
                            if (!Component) return null;
                            return (
                                <div key={sec.id}>
                                    <Component settings={settingsWithOrgId} products={products} />
                                </div>
                            );
                        })
                    }

                </main>

                <StorefrontFooter orgName={org.name} settings={org.settings} />
                <CartDrawer orgId={org.id} currency={currency} />
                <CartFloatingButton />
            </div>
        </CartProvider>
    );
}
