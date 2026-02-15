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

// Force dynamic if needed, but ISR/Static is better for storefronts.
export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>;
};

async function getOrganization(slug: string) {
    const supabase = await createClient();
    const { data: org } = await supabase
        .from("organizations")
        .select("id, name, slug, settings, created_at")
        .eq("slug", slug)
        .single();
    return org;
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

export default async function StorefrontPage({ params }: Props) {
    const { slug } = await params;
    const org = await getOrganization(slug);

    if (!org) {
        notFound();
    }

    const supabase = await createClient();
    // Fetch active products
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", org.id)
        .eq("is_active", true)
        .order("category", { ascending: true });

    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col font-sans bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative">
                <StorefrontHeader orgName={org.name} />

                <main className="flex-1">
                    <Hero orgName={org.name} settings={org.settings} />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
                        {/* Introduction / About (Placeholder) */}
                        <div id="about" className="text-center max-w-2xl mx-auto space-y-4">
                            <h2 className="text-3xl font-serif font-bold text-secondary">La touche {org.name}</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Nous concoctons des plats authentiques avec des ingrédients frais et locaux.
                                Que ce soit pour un mariage grandiose ou un dîner intime, nous apportons la saveur à votre table.
                            </p>
                        </div>

                        <MenuSection products={products || []} />
                    </div>
                </main>

                <StorefrontFooter orgName={org.name} settings={org.settings} />
                <CartDrawer orgId={org.id} />
                <CartFloatingButton />
            </div>
        </CartProvider>
    );
}
