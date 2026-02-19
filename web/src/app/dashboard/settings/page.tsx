import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Store, Utensils, CalendarDays, Info, Kanban, Globe } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/settings/SettingsForm";
import { SiteSettings } from "@/components/dashboard/settings/SiteSettings";
import { CapacitySettings } from "@/components/settings/CapacitySettings";
import { KanbanSettings } from "@/components/dashboard/orders/KanbanSettings";
import { DEFAULT_KANBAN_COLUMNS } from "@/components/dashboard/orders/KanbanBoard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        .order("load_cost", { ascending: true });

    const kanbanColumns = settings.kanban_columns || DEFAULT_KANBAN_COLUMNS;

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-border pb-6">
                <div className="flex items-center gap-2 text-primary font-medium mb-1">
                    <Store className="h-5 w-5" />
                    <span>Configuration</span>
                </div>
                <h1 className="text-3xl font-bold font-serif text-secondary">
                    Paramètres de la Boutique
                </h1>
                <p className="text-muted-foreground">
                    Gérez votre identité, votre site vitrine et vos types de prestations.
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full space-y-6">
                <TabsList className="grid w-full max-w-[800px]" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                    <TabsTrigger value="general" className="gap-1.5 text-xs">
                        <Store className="h-3.5 w-3.5" /> Boutique
                    </TabsTrigger>
                    <TabsTrigger value="site" className="gap-1.5 text-xs">
                        <Globe className="h-3.5 w-3.5" /> Site Web
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="gap-1.5 text-xs">
                        <Utensils className="h-3.5 w-3.5" /> Menu
                    </TabsTrigger>
                    <TabsTrigger value="capacity" className="gap-1.5 text-xs">
                        <CalendarDays className="h-3.5 w-3.5" /> Prestations
                    </TabsTrigger>
                    <TabsTrigger value="kanban" className="gap-1.5 text-xs">
                        <Kanban className="h-3.5 w-3.5" /> Kanban
                    </TabsTrigger>
                </TabsList>

                {/* ── Boutique (General) ──────────────────────── */}
                <TabsContent value="general" className="space-y-4">
                    <SettingsForm org={org} settings={settings} />
                </TabsContent>

                {/* ── Site Web ────────────────────────────────── */}
                <TabsContent value="site" className="space-y-4">
                    <div className="flex flex-col gap-1 pb-4">
                        <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-bold text-secondary">Personnalisation du site vitrine</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Configurez les sections affichées sur votre site public, leur contenu et leurs textes.
                        </p>
                    </div>
                    <SiteSettings org={org} settings={settings} />
                </TabsContent>

                {/* ── Menu & Infos ─────────────────────────────── */}
                <TabsContent value="menu" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                Informations Menu
                            </CardTitle>
                            <CardDescription>
                                Mentions légales, allergènes, labels de qualité affichés sur votre carte.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Cette section est en cours de développement. Bientôt, vous pourrez ajouter ici des mentions légales concernant vos produits, des labels de qualité, ou des messages personnalisés pour vos clients.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Capacity ─────────────────────────────────── */}
                <TabsContent value="capacity" className="space-y-4">
                    <CapacitySettings capacityTypes={capacityTypes || []} />
                </TabsContent>

                {/* ── Kanban ───────────────────────────────────── */}
                <TabsContent value="kanban" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Kanban className="h-5 w-5 text-primary" />
                                Étapes du Kanban
                            </CardTitle>
                            <CardDescription>
                                Personnalisez les colonnes du tableau Kanban pour vos devis et commandes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <KanbanSettings initialColumns={kanbanColumns} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
