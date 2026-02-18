import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Store, Utensils, CalendarDays, Info } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/settings/SettingsForm";
import { CapacitySettings } from "@/components/settings/CapacitySettings";
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
    const settings = org.settings || {};

    // Fetch Capacity Types
    const { data: capacityTypes } = await supabase
        .from("capacity_types")
        .select("*")
        .eq("organization_id", org.id)
        .order("load_cost", { ascending: true }); // Order by cost usually makes sense

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
                    Gérez votre identité, vos types d'événements et vos informations.
                </p>
            </div>

            <Tabs defaultValue="general" className="w-full space-y-6">
                <TabsList className="grid w-full grid-cols-3 max-w-[500px]">
                    <TabsTrigger value="general" className="gap-2">
                        <Store className="h-4 w-4" /> Boutique
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="gap-2">
                        <Utensils className="h-4 w-4" /> Menu & Infos
                    </TabsTrigger>
                    <TabsTrigger value="capacity" className="gap-2">
                        <CalendarDays className="h-4 w-4" /> Types d'événements
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Boutique (General Settings) */}
                <TabsContent value="general" className="space-y-4">
                    <SettingsForm org={org} settings={settings} />
                </TabsContent>

                {/* Tab: Menu & Infos */}
                <TabsContent value="menu" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                Informations Menu
                            </CardTitle>
                            <CardDescription>
                                Personnalisez les informations affichées sur votre carte (allergènes, origines, etc.).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Cette section est en cours de développement. Bientôt, vous pourrez ajouter ici des mentions légales concernant vos produits, des labels de qualité, ou des messages personnalisés pour vos clients.
                            </p>
                            {/* TODO: Add specific fields here based on further user feedback */}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Capacity Types */}
                <TabsContent value="capacity" className="space-y-4">
                    <CapacitySettings capacityTypes={capacityTypes || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
