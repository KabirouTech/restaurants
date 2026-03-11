import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { format, addMonths } from "date-fns";
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
import { cn } from "@/lib/utils";
import { resolveStorefrontTemplate } from "@/lib/storefront-templates";

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

async function getClosedDatesInfo(orgId: string) {
    const supabase = getAdminClient();
    const today = format(new Date(), "yyyy-MM-dd");
    const futureLimit = format(addMonths(new Date(), 6), "yyyy-MM-dd");

    const [{ data: overrides }, { data: defaults }] = await Promise.all([
        supabase
            .from("calendar_overrides")
            .select("date")
            .eq("organization_id", orgId)
            .eq("is_blocked", true)
            .gte("date", today)
            .lte("date", futureLimit),
        supabase
            .from("defaults_calendar")
            .select("day_of_week, is_open")
            .eq("organization_id", orgId),
    ]);

    return {
        blockedDates: (overrides || []).map(o => o.date),
        closedDaysOfWeek: (defaults || []).filter(d => !d.is_open).map(d => d.day_of_week),
    };
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

function getStorefrontContainerClass(template: string): string {
    if (template === "bistro") {
        return "storefront-template-bistro bg-zinc-950 text-zinc-100";
    }
    if (template === "catering") {
        return "storefront-template-catering bg-[#f8fbf7]";
    }
    if (template === "restaurant") {
        return "storefront-template-restaurant bg-stone-50";
    }
    return "storefront-template-classic bg-background text-foreground";
}

function getStorefrontMainContainerClass(template: string): string {
    if (template === "bistro") {
        return "max-w-7xl";
    }
    if (template === "catering") {
        return "max-w-7xl";
    }
    if (template === "restaurant") {
        return "max-w-7xl";
    }
    return "max-w-6xl";
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

    const [products, closedDatesInfo] = await Promise.all([
        getProducts(org.id),
        getClosedDatesInfo(org.id),
    ]);
    const s = (org.settings || {}) as Record<string, any>;
    const primaryHsl = s.primary_color ? hexToHsl(s.primary_color) : null;
    const currency = s.currency || "EUR";
    const storefrontTemplate = resolveStorefrontTemplate(s.storefront_template, org.subscription_plan);

    // Resolve sections: merge saved config with defaults so new defaults appear
    const savedSections: StorefrontSection[] = s.sections || [];
    const sections: StorefrontSection[] = DEFAULT_SECTIONS.map((def) => {
        const saved = savedSections.find((sec) => sec.id === def.id);
        return saved ? { ...def, ...saved } : def;
    });

    const enabledSections = sections.filter((sec) => sec.enabled);
    const cateringSectionOrder: Record<string, number> = {
        services: 0,
        menu: 1,
        about: 2,
        testimonials: 3,
        gallery: 4,
        contact: 5,
    };
    const orderedEnabledSections = storefrontTemplate === "catering"
        ? [...enabledSections].sort((a, b) => (cateringSectionOrder[a.id] ?? 99) - (cateringSectionOrder[b.id] ?? 99))
        : enabledSections;

    // Enrich settings with org_id and closed dates so client components can use them
    const settingsWithOrgId = {
        ...(org.settings || {}),
        org_id: org.id,
        closedDatesInfo,
        storefront_template: storefrontTemplate,
    };


    return (
        <CartProvider>
            <div
                className={cn(
                    "min-h-screen flex flex-col font-sans selection:bg-primary/30",
                    getStorefrontContainerClass(storefrontTemplate)
                )}
                style={primaryHsl ? { "--primary": primaryHsl } as React.CSSProperties : {}}
            >
                <StorefrontHeader
                    orgName={org.name}
                    settings={settingsWithOrgId}
                    sections={sections}
                    template={storefrontTemplate}
                />

                {/* Hero — constrained with side margins, not full-bleed */}
                <div className={cn(
                    "mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-4",
                    getStorefrontMainContainerClass(storefrontTemplate)
                )}>
                    <Hero orgName={org.name} settings={settingsWithOrgId} template={storefrontTemplate} />
                </div>


                {/* Dynamic sections */}
                <main className={cn(
                    "flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8",
                    storefrontTemplate === "catering"
                        ? "space-y-0"
                        : "space-y-0 divide-y divide-border/30",
                    getStorefrontMainContainerClass(storefrontTemplate)
                )}>
                    {storefrontTemplate === "catering" ? (
                        orderedEnabledSections.map((sec) => {
                            if (sec.id === "menu") {
                                return (
                                    <div key={sec.id} className="py-0">
                                        <MenuSection products={products} currency={currency} template={storefrontTemplate} />
                                    </div>
                                );
                            }
                            const Component = SECTION_COMPONENTS[sec.id];
                            if (!Component) return null;
                            return (
                                <div key={sec.id}>
                                    <Component settings={settingsWithOrgId} products={products} />
                                </div>
                            );
                        })
                    ) : (
                        <>
                            {/* Menu is always present */}
                            <div className="py-0">
                                <MenuSection products={products} currency={currency} template={storefrontTemplate} />
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
                        </>
                    )}

                </main>

                <StorefrontFooter orgName={org.name} settings={settingsWithOrgId} template={storefrontTemplate} />
                <CartDrawer orgId={org.id} currency={currency} closedDatesInfo={closedDatesInfo} />
                <CartFloatingButton />
            </div>
        </CartProvider>
    );
}
