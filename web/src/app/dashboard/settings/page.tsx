import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Store, Utensils, CalendarDays, Info, Kanban, Globe, MessageCircle } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/settings/SettingsForm";
import { SiteSettings } from "@/components/dashboard/settings/SiteSettings";
import { CapacitySettings } from "@/components/settings/CapacitySettings";
import { KanbanSettings } from "@/components/dashboard/orders/KanbanSettings";
import { DEFAULT_KANBAN_COLUMNS } from "@/components/dashboard/orders/KanbanBoard";
import { ChannelSettings } from "@/components/dashboard/settings/ChannelSettings";
import { BillingSettings } from "@/components/dashboard/settings/BillingSettings";
import { MembersSettings } from "@/components/dashboard/settings/MembersSettings";
import { MenuInfoSettings } from "@/components/dashboard/settings/MenuInfoSettings";
import { SettingsSidebar } from "@/components/dashboard/settings/SettingsSidebar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
    const t = await getTranslations("dashboard.settings");
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
            <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-4 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                            <Store className="h-5 w-5" />
                            <span>{t('configuration')}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
                            {t('pageTitle')}
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            {t('pageSubtitle')}
                        </p>
                    </div>
                    {/* Save Portal Target */}
                    <div id="settings-save-portal" className="shrink-0 flex items-center justify-end"></div>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                <Tabs defaultValue="general" className="flex flex-col gap-0 md:flex-row md:gap-8 w-full items-start">

                    {/* Sidebar — sticky on mobile (top scroll), sticky on desktop */}
                    <div className="shrink-0 z-10 w-full md:w-auto md:self-stretch -mx-4 md:mx-0 mb-4 md:mb-0">
                        <SettingsSidebar />
                    </div>

                    <div className="flex-1 w-full min-w-0 md:pl-2">
                        {/* ── Boutique (General) ──────────────────────── */}
                        <TabsContent value="general" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('shopAndContact')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('shopAndContactDesc')}
                                </p>
                            </div>
                            <SettingsForm org={org} settings={settings} />
                        </TabsContent>

                        {/* ── Site Web ────────────────────────────────── */}
                        <TabsContent value="site" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('siteEditor')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('siteEditorDesc')}
                                </p>
                            </div>
                            <SiteSettings org={org} settings={settings} products={products || []} />
                        </TabsContent>

                        {/* ── Menu & Infos ─────────────────────────────── */}
                        <TabsContent value="menu" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('menuAndAllergens')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('menuAndAllergensDesc')}
                                </p>
                            </div>
                            <MenuInfoSettings orgId={org.id} settings={settings} />
                        </TabsContent>

                        {/* ── Capacity ─────────────────────────────────── */}
                        <TabsContent value="capacity" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('servicesAndEvents')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('servicesAndEventsDesc')}
                                </p>
                            </div>
                            <CapacitySettings capacityTypes={capacityTypes || []} />
                        </TabsContent>

                        {/* ── Kanban ───────────────────────────────────── */}
                        <TabsContent value="kanban" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('workflow')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('workflowDesc')}
                                </p>
                            </div>
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base">{t('customSteps')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <KanbanSettings initialColumns={kanbanColumns} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── Canaux (Messaging Channels) ─────────────── */}
                        <TabsContent value="channels" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('messagingChannels')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('messagingChannelsDesc')}
                                </p>
                            </div>
                            <ChannelSettings orgId={org.id} />
                        </TabsContent>

                        {/* ── Membres ──────────────────────────────────── */}
                        <TabsContent value="members" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('teamMembers')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('teamMembersDesc')}
                                </p>
                            </div>
                            <MembersSettings orgId={org.id} currentUserProfileId={profile.id} />
                        </TabsContent>

                        {/* ── Abonnement ───────────────────────────────── */}
                        <TabsContent value="billing" className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0">
                            <div className="flex flex-col gap-1 pb-4">
                                <h2 className="text-xl font-bold text-foreground">{t('subscription')}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('subscriptionDesc')}
                                </p>
                            </div>
                            <BillingSettings orgId={org.id} currentPlan={org.subscription_plan || 'free'} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
