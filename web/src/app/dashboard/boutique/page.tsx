import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Palette, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteSettings } from "@/components/dashboard/settings/SiteSettings";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function BoutiquePage() {
    const t = await getTranslations("dashboard.boutique");
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    let org = profile.organizations as Record<string, any> | null | undefined;
    if (!org) {
        const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", profile.organization_id)
            .single();
        org = orgData;
    }

    if (!org) redirect("/dashboard/onboarding");

    const settings = (org.settings || {}) as Record<string, any>;

    const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", org.id)
        .eq("is_active", true);

    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-24">
            <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-4 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                            <Palette className="h-5 w-5" />
                            <span>{t("badge")}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
                            {t("title")}
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            {t("subtitle")}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/settings">
                                <Globe className="h-4 w-4 mr-2" />
                                {t("settingsLink")}
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/${org.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {t("viewPublic")}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                <SiteSettings
                    org={org}
                    settings={settings}
                    products={products || []}
                    currentPlan={(org.subscription_plan || "free") as "free" | "premium" | "enterprise"}
                />
            </div>
        </div>
    );
}
