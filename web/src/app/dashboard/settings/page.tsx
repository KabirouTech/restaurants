import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Store, Utensils, CalendarDays, Info, Kanban, Globe, MessageCircle } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/settings/SettingsForm";
import { SiteSettings } from "@/components/dashboard/settings/SiteSettings";
import { CapacitySettings } from "@/components/settings/CapacitySettings";
import { KanbanSettings } from "@/components/dashboard/orders/KanbanSettings";
import { DEFAULT_KANBAN_COLUMNS } from "@/components/dashboard/orders/KanbanBoard";
import { ChannelSettings } from "@/components/dashboard/settings/ChannelSettings";
import { SettingsSidebar } from "@/components/dashboard/settings/SettingsSidebar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*, organizations(*)")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    const org = profile.organizations;
    const settings = (org.settings || {}) as Record<string, any>;

    const { data: capacityTypes } = await supabase
        .from("capacity_types")
        .select("*")
        .eq("organization_id", org.id)
        .eq("organization_id", org.id)
        .order("load_cost", { ascending: true });

    const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", org.id)
        .eq("is_active", true);

    const kanbanColumns = settings.kanban_columns || DEFAULT_KANBAN_COLUMNS;

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-24">
            {/* Header (Sticky) */}
            <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                            <Store className="h-5 w-5" />
                            <span>Configuration</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
                            Paramètres de la Boutique
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            Gérez votre identité, votre site vitrine et vos opérations.
                        </p>
                    </div>
                    {/* Save Portal Target */}
                    <div id="settings-save-portal" className="shrink-0 flex items-center justify-end"></div>
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
                <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-8 w-full items-start">

                    {/* Vertical Sidebar — self-stretch so sticky has room to stick */}
                    <div className="shrink-0 z-10 w-full md:w-auto md:self-stretch">
                        <SettingsSidebar />
                    </div>

                    <div className="flex-1 w-full min-w-0 md:pl-2">
                        {/* ── Boutique (General) ──────────────────────── */}
                        <TabsContent value="general" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">Boutique & Contact</h2>
                                <p className="text-sm text-muted-foreground">
                                    Informations légales, devise et coordonnées de l'établissement.
                                </p>
                            </div>
                            <SettingsForm org={org} settings={settings} />
                        </TabsContent>

                        {/* ── Site Web ────────────────────────────────── */}
                        <TabsContent value="site" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">Éditeur Vitrine</h2>
                                <p className="text-sm text-muted-foreground">
                                    Personnalisez l'apparence, les couleurs, et les sections de votre site internet.
                                </p>
                            </div>
                            <SiteSettings org={org} settings={settings} products={products || []} />
                        </TabsContent>

                        {/* ── Menu & Infos ─────────────────────────────── */}
                        <TabsContent value="menu" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">Carte & Allergènes</h2>
                                <p className="text-sm text-muted-foreground">
                                    Mentions légales, allergènes, et labels de qualité affichés sur votre carte.
                                </p>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Info className="h-5 w-5 text-primary" />
                                        Informations Menu
                                    </CardTitle>
                                    <CardDescription>
                                        Cette section est en cours de développement.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Bientôt, vous pourrez ajouter ici des mentions légales concernant vos produits, des labels de qualité (Fait Maison, Bio...), ou des messages personnalisés pour vos clients.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── Capacity ─────────────────────────────────── */}
                        <TabsContent value="capacity" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">Prestations & Événements</h2>
                                <p className="text-sm text-muted-foreground">
                                    Configurez les types d'événements et leur impact sur votre calendrier.
                                </p>
                            </div>
                            <CapacitySettings capacityTypes={capacityTypes || []} />
                        </TabsContent>

                        {/* ── Kanban ───────────────────────────────────── */}
                        <TabsContent value="kanban" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">Flux de travail (Kanban)</h2>
                                <p className="text-sm text-muted-foreground">
                                    Personnalisez les étapes par lesquelles passent vos devis et commandes.
                                </p>
                            </div>
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base">Étapes personnalisées</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <KanbanSettings initialColumns={kanbanColumns} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── Canaux (Messaging Channels) ─────────────── */}
                        <TabsContent value="channels" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">Canaux de Messagerie</h2>
                                <p className="text-sm text-muted-foreground">
                                    Connectez WhatsApp, Instagram et Email pour centraliser tous vos échanges.
                                </p>
                            </div>
                            <ChannelSettings orgId={org.id} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
