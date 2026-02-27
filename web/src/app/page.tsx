import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowRight, BookOpen, CalendarDays, Check, ChefHat,
    FileText, MessageSquare, Package, ShoppingCart,
    Truck, Users, Mic, FolderOpen, Download, X,
    Star, AlertTriangle, Clock, Layers, Zap
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
    title: "RestaurantsOS — La plateforme des traiteurs d'Afrique de l'Ouest",
    description: "Devis, calendrier, messagerie unifiée, recettes et inventaire dans une seule app. Arrêtez de gérer votre business sur WhatsApp.",
};

const FALLBACK_EMBED = `<div style="position: relative; padding-bottom: calc(55.614% + 41px); height: 0; width: 100%"><iframe src="https://demo.arcade.software/VkRNI4fK5nikm8iaDOtG?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true" title="Créer votre espace RestaurantOS et lancer le dashboard" frameBorder="0" loading="lazy" allowFullScreen allow="clipboard-write" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; color-scheme: light"></iframe></div>`;

export default async function LandingPage() {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: featured } = await supabase
        .from("platform_tutorials")
        .select("embed_code")
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(1)
        .single();

    const heroEmbed = featured?.embed_code || FALLBACK_EMBED;

    const t = await getTranslations("homepage");
    const tNav = await getTranslations("nav");

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">

            {/* ── Navbar ────────────────────────────── */}
            <header className="fixed top-0 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl z-50">
                <div className="container mx-auto px-6 h-18 flex items-center justify-between py-4">
                    <Logo size="lg" href="/" className="text-secondary" />
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <Link href="#probleme" className="hover:text-foreground transition-colors">{tNav("why")}</Link>
                        <Link href="#fonctionnalites" className="hover:text-foreground transition-colors">{tNav("features")}</Link>
                        <Link href="#tarifs" className="hover:text-foreground transition-colors">{tNav("pricing")}</Link>
                        <Link href="/tutoriels" className="hover:text-foreground transition-colors">{tNav("tutorials")}</Link>
                    </nav>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
                            {tNav("login")}
                        </Link>
                        <Link href="/auth/signup">
                            <Button className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2 shadow-md shadow-primary/20 text-sm">
                                {tNav("freeTrial")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero ──────────────────────────────── */}
            <section className="pt-36 pb-16 md:pt-52 md:pb-24 px-6 relative overflow-hidden">
                {/* Background accents */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-background to-amber-50/30 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 -z-10" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/8 rounded-full blur-[140px] -z-10 translate-x-1/3 -translate-y-1/3" />

                <div className="container mx-auto max-w-4xl text-center space-y-7">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {t("hero.badge")}
                    </div>

                    <h1 className="text-5xl md:text-[68px] font-bold tracking-tight text-secondary font-serif leading-[1.08]">
                        {t("hero.title1")}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-amber-500">
                            {t("hero.title2")}
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t("hero.subtitle")}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
                        <Link href="/auth/signup">
                            <Button size="lg" className="h-13 px-8 rounded-full text-base bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.03] font-semibold">
                                {t("hero.cta")} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="outline" size="lg" className="h-13 px-8 rounded-full text-base border-2 font-semibold hover:border-secondary hover:text-secondary transition-all">
                                {t("hero.demo")}
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-muted-foreground pt-1">
                        {t("hero.free")}
                    </p>

                    {/* Arcade embed */}
                    <div className="pt-14 md:pt-20 w-full max-w-5xl mx-auto">
                        <div className="relative rounded-2xl border-2 border-border/60 bg-card shadow-[0_30px_80px_-20px_rgba(234,88,12,0.18)] overflow-hidden">
                            <div dangerouslySetInnerHTML={{ __html: heroEmbed }} />
                        </div>
                        <p className="mt-5 text-center text-sm text-muted-foreground">
                            {t("hero.demoNote")}{" "}
                            <Link href="/tutoriels" className="text-primary hover:underline font-medium">
                                {t("hero.demoLink")}
                            </Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Trust bar ─────────────────────────── */}
            <div className="py-10 border-y border-border/50 bg-muted/20">
                <div className="container mx-auto px-6">
                    <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">{t("trust.label")}</p>
                    <div className="flex flex-wrap items-center justify-center gap-10 opacity-50 hover:opacity-80 transition-opacity duration-500">
                        {["Chez Fatou", "Dakar Catering", "Teranga Events", "Saveurs d'Afrik", "Le Roi du Thiébou"].map(name => (
                            <span key={name} className="text-lg font-bold font-serif text-secondary">{name}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Problem section ───────────────────── */}
            <section id="probleme" className="py-24 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold font-serif text-secondary">
                            {t("problem.title")}
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                            {t("problem.subtitle")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <MessageSquare className="h-6 w-6" />,
                                title: t("problem.lostOrders.title"),
                                body: t("problem.lostOrders.body"),
                            },
                            {
                                icon: <AlertTriangle className="h-6 w-6" />,
                                title: t("problem.doubleBooking.title"),
                                body: t("problem.doubleBooking.body"),
                            },
                            {
                                icon: <Clock className="h-6 w-6" />,
                                title: t("problem.slowQuotes.title"),
                                body: t("problem.slowQuotes.body"),
                            },
                        ].map(({ icon, title, body }) => (
                            <div key={title} className="p-6 rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 space-y-4">
                                <div className="h-11 w-11 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">
                                    {icon}
                                </div>
                                <h3 className="font-bold text-foreground font-serif text-lg">{title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>

                    {/* Bridge to solution */}
                    <div className="mt-16 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/10 border border-primary/20">
                            <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                            <p className="text-sm font-semibold text-foreground">
                                {t("problem.solution")}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ──────────────────────────── */}
            <section id="fonctionnalites" className="py-24 px-6 bg-card border-y border-border">
                <div className="container mx-auto max-w-6xl space-y-24">

                    {/* F1: Commandes & Devis */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 order-2 md:order-1">
                            <FeaturePill icon={<ShoppingCart className="h-3.5 w-3.5" />} label={t("features.orders.pill")} />
                            <h3 className="text-3xl md:text-4xl font-bold font-serif text-secondary leading-tight">
                                {t("features.orders.title")}
                            </h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {t("features.orders.body")}
                            </p>
                            <ul className="space-y-3">
                                {(t.raw("features.orders.items") as string[]).map((item: string) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="order-1 md:order-2">
                            <MockOrderCard tr={t.raw("mocks.orderCard") as MockOrderCardTr} />
                        </div>
                    </div>

                    {/* F2: Calendrier */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <MockCalendar tr={t.raw("mocks.calendar") as MockCalendarTr} />
                        </div>
                        <div className="space-y-6">
                            <FeaturePill icon={<CalendarDays className="h-3.5 w-3.5" />} label={t("features.calendar.pill")} />
                            <h3 className="text-3xl md:text-4xl font-bold font-serif text-secondary leading-tight">
                                {t("features.calendar.title")}
                            </h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {t("features.calendar.body")}
                            </p>
                            <ul className="space-y-3">
                                {(t.raw("features.calendar.items") as string[]).map((item: string) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* F3: Messagerie unifiée */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6 order-2 md:order-1">
                            <FeaturePill icon={<MessageSquare className="h-3.5 w-3.5" />} label={t("features.inbox.pill")} />
                            <h3 className="text-3xl md:text-4xl font-bold font-serif text-secondary leading-tight">
                                {t("features.inbox.title")}
                            </h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                {t("features.inbox.body")}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: "WhatsApp", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" },
                                    { label: "Instagram", color: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400" },
                                    { label: "Email", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
                                    { label: "Messenger", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400" },
                                ].map(({ label, color }) => (
                                    <span key={label} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border", color)}>{label}</span>
                                ))}
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <MockInbox tr={t.raw("mocks.inbox") as MockInboxTr} />
                        </div>
                    </div>

                    {/* F4-F7: Secondary features grid */}
                    <div>
                        <div className="text-center mb-12">
                            <h3 className="text-2xl md:text-3xl font-bold font-serif text-secondary">{t("features.moreTitle")}</h3>
                            <p className="text-muted-foreground mt-3">{t("features.moreSubtitle")}</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[
                                {
                                    icon: <BookOpen className="h-5 w-5" />,
                                    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
                                    title: t("features.recipes.title"),
                                    desc: t("features.recipes.desc"),
                                },
                                {
                                    icon: <Package className="h-5 w-5" />,
                                    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
                                    title: t("features.inventory.title"),
                                    desc: t("features.inventory.desc"),
                                },
                                {
                                    icon: <Truck className="h-5 w-5" />,
                                    color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30",
                                    title: t("features.suppliers.title"),
                                    desc: t("features.suppliers.desc"),
                                },
                                {
                                    icon: <FileText className="h-5 w-5" />,
                                    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
                                    title: t("features.menu.title"),
                                    desc: t("features.menu.desc"),
                                },
                                {
                                    icon: <Users className="h-5 w-5" />,
                                    color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
                                    title: t("features.crm.title"),
                                    desc: t("features.crm.desc"),
                                },
                                {
                                    icon: <Layers className="h-5 w-5" />,
                                    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30",
                                    title: t("features.team.title"),
                                    desc: t("features.team.desc"),
                                },
                            ].map(({ icon, color, title, desc }) => (
                                <div key={title} className="p-6 rounded-2xl border border-border bg-background hover:shadow-md transition-shadow group">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200", color)}>
                                        {icon}
                                    </div>
                                    <h4 className="font-bold text-foreground font-serif mb-2">{title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How it works ──────────────────────── */}
            <section className="py-24 px-6">
                <div className="container mx-auto max-w-3xl text-center space-y-16">
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold font-serif text-secondary">{t("howItWorks.title")}</h2>
                        <p className="text-muted-foreground text-lg">{t("howItWorks.subtitle")}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        {[
                            { step: "01", title: t("howItWorks.step1.title"), desc: t("howItWorks.step1.desc"), icon: <Zap className="h-5 w-5" /> },
                            { step: "02", title: t("howItWorks.step2.title"), desc: t("howItWorks.step2.desc"), icon: <ChefHat className="h-5 w-5" /> },
                            { step: "03", title: t("howItWorks.step3.title"), desc: t("howItWorks.step3.desc"), icon: <Star className="h-5 w-5" /> },
                        ].map(({ step, title, desc, icon }) => (
                            <div key={step} className="space-y-4">
                                <div className="relative mx-auto h-16 w-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary">
                                    {icon}
                                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{step}</span>
                                </div>
                                <h4 className="font-bold font-serif text-foreground text-lg">{title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Import highlight ──────────────────── */}
            <section className="py-16 px-6 bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 border-y border-emerald-100 dark:border-emerald-900/30">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="flex-1 space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                                <Download className="h-3.5 w-3.5" />
                                {t("import.badge")}
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold font-serif text-secondary">
                                {t("import.title")}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {t("import.body")}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 flex-shrink-0">
                            {(t.raw("import.items") as string[]).map(item => (
                                <div key={item} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-border shadow-sm text-sm font-medium text-foreground">
                                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pricing ───────────────────────────── */}
            <section id="tarifs" className="py-24 px-6 bg-card border-y border-border">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold font-serif text-secondary">
                            {t("pricing.title")}
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            {t("pricing.subtitle")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 items-start">
                        {/* Free */}
                        <PricingCard
                            name={t("pricing.free.name")}
                            price={t("pricing.free.price")}
                            period={t("pricing.free.period")}
                            description={t("pricing.free.description")}
                            features={t.raw("pricing.free.features") as string[]}
                            missing={t.raw("pricing.free.missing") as string[]}
                            cta={t("pricing.free.cta")}
                            ctaHref="/auth/signup"
                            variant="default"
                        />

                        {/* Premium */}
                        <PricingCard
                            name={t("pricing.premium.name")}
                            price={t("pricing.premium.price")}
                            period={t("pricing.premium.period")}
                            description={t("pricing.premium.description")}
                            features={t.raw("pricing.premium.features") as string[]}
                            missing={t.raw("pricing.premium.missing") as string[]}
                            cta={t("pricing.premium.cta")}
                            ctaHref="/auth/signup"
                            variant="featured"
                            badge={t("pricing.premium.badge")}
                        />

                        {/* Enterprise */}
                        <PricingCard
                            name={t("pricing.enterprise.name")}
                            price={t("pricing.enterprise.price")}
                            period={t("pricing.enterprise.period")}
                            description={t("pricing.enterprise.description")}
                            features={t.raw("pricing.enterprise.features") as string[]}
                            missing={t.raw("pricing.enterprise.missing") as string[]}
                            cta={t("pricing.enterprise.cta")}
                            ctaHref="#"
                            variant="enterprise"
                        />
                    </div>
                </div>
            </section>

            {/* ── Testimonial ───────────────────────── */}
            <section id="testimonials" className="py-24 px-6 bg-secondary text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                <div className="container mx-auto max-w-3xl text-center relative z-10 space-y-12">
                    <h2 className="text-3xl font-serif font-bold">{t("testimonials.title")}</h2>
                    <div className="bg-white/10 backdrop-blur-md p-10 rounded-2xl border border-white/10 space-y-6">
                        <div className="flex items-center justify-center gap-1">
                            {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
                        </div>
                        <p className="text-xl italic font-serif leading-relaxed">
                            &quot;{t("testimonials.quote")}&quot;
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary border-2 border-white/50 flex items-center justify-center text-white font-bold text-lg">A</div>
                            <div className="text-left">
                                <p className="font-bold">{t("testimonials.author")}</p>
                                <p className="text-sm opacity-70">{t("testimonials.role")}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-10 opacity-60">
                        {["Chez Fatou", "Dakar Catering", "Teranga Events", "Saveurs d'Afrik"].map(n => (
                            <span key={n} className="text-lg font-bold font-serif">{n}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ─────────────────────────── */}
            <section className="py-28 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-amber-50/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 -z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/6 rounded-full blur-[120px] -z-10" />
                <div className="container mx-auto max-w-2xl text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold font-serif text-secondary leading-tight">
                        {t("cta.title")}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {t("cta.subtitle")}
                    </p>
                    <Link href="/auth/signup">
                        <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/25 transition-all hover:scale-105 font-semibold">
                            {t("cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        {t("cta.note")}
                    </p>
                </div>
            </section>

            {/* ── Footer ────────────────────────────── */}
            <footer className="py-16 bg-muted/20 border-t border-border">
                <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-5">
                        <Logo size="md" href="/" className="text-secondary" />
                        <p className="text-muted-foreground max-w-xs leading-relaxed text-sm">
                            {t("footer.tagline")}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wide">{t("footer.product")}</h4>
                        <ul className="space-y-3 text-muted-foreground text-sm">
                            <li><Link href="#fonctionnalites" className="hover:text-primary transition-colors">{t("footer.features")}</Link></li>
                            <li><Link href="#tarifs" className="hover:text-primary transition-colors">{t("footer.pricing")}</Link></li>
                            <li><Link href="/tutoriels" className="hover:text-primary transition-colors">{t("footer.tutorials")}</Link></li>
                            <li><Link href="/auth/signup" className="hover:text-primary transition-colors">{t("footer.freeTrial")}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-5 text-sm uppercase tracking-wide">{t("footer.company")}</h4>
                        <ul className="space-y-3 text-muted-foreground text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">{t("footer.about")}</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">{t("footer.contact")}</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">{t("footer.legal")}</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-6 pt-10 mt-10 border-t border-border text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} RestaurantsOS · {t("footer.copyright")}
                </div>
            </footer>
        </div>
    );
}

/* ── Sub-component types ────────────────────── */

type MockOrderCardTr = {
    label: string; status: string; event: string;
    date: string; total: string; deposit: string;
    items: { name: string; qty: string; price: string }[];
    totalAmount: string; depositAmount: string;
};
type MockCalendarTr = {
    month: string; eventsCount: string; full: string;
    days: string[];
    events: { name: string; date: string }[];
};
type MockInboxTr = {
    title: string;
    conversations: { name: string; msg: string; time: string }[];
};

/* ── Sub-components ─────────────────────────── */

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide border border-primary/20">
            {icon}
            {label}
        </div>
    );
}

function MockOrderCard({ tr }: { tr: MockOrderCardTr }) {
    return (
        <div className="rounded-2xl border border-border bg-background shadow-xl p-5 space-y-4 max-w-sm mx-auto">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr.label}</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{tr.status}</span>
            </div>
            <div>
                <p className="font-bold text-foreground font-serif text-lg">{tr.event}</p>
                <p className="text-sm text-muted-foreground">{tr.date}</p>
            </div>
            <div className="space-y-2 border-y border-border py-4">
                {tr.items.map(({ name, qty, price }) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium">{name} <span className="text-muted-foreground font-normal">{qty}</span></span>
                        <span className="text-muted-foreground">{price}</span>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">{tr.total}</p>
                    <p className="font-bold text-foreground text-xl">{tr.totalAmount}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">{tr.deposit}</p>
                    <p className="font-semibold text-emerald-600">{tr.depositAmount}</p>
                </div>
            </div>
        </div>
    );
}

function MockCalendar({ tr }: { tr: MockCalendarTr }) {
    const cells = [
        { label: "1", load: 0 }, { label: "2", load: 0 }, { label: "3", load: 75 },
        { label: "4", load: 0 }, { label: "5", load: 0 }, { label: "6", load: 100, event: true },
        { label: "7", load: 0 }, { label: "8", load: 0 }, { label: "9", load: 0 },
        { label: "10", load: 40 }, { label: "11", load: 0 }, { label: "12", load: 0 },
        { label: "13", load: 100, event: true }, { label: "14", load: 0 }, { label: "15", load: 0 },
        { label: "16", load: 0 }, { label: "17", load: 60 }, { label: "18", load: 0 },
        { label: "19", load: 0 }, { label: "20", load: 100, event: true }, { label: "21", load: 0 },
    ];
    return (
        <div className="rounded-2xl border border-border bg-background shadow-xl p-5 max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-4">
                <p className="font-bold font-serif text-foreground">{tr.month}</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">{tr.eventsCount}</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
                {tr.days.map((d, i) => <div key={i} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map(({ label, load, event }) => (
                    <div key={label} className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium relative overflow-hidden",
                        load === 0 ? "text-muted-foreground hover:bg-muted/50" :
                        load === 100 ? "bg-primary/15 text-primary font-bold border border-primary/30" :
                        "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    )}>
                        {label}
                        {load > 0 && load < 100 && (
                            <div className="absolute bottom-0.5 left-1 right-1 h-0.5 rounded-full bg-amber-200 dark:bg-amber-800">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${load}%` }} />
                            </div>
                        )}
                        {event && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                ))}
            </div>
            <div className="mt-4 space-y-2">
                {tr.events.map(({ name, date }) => (
                    <div key={name} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 text-xs">
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{name}</p>
                            <p className="text-muted-foreground">{date}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold flex-shrink-0">{tr.full}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const CHANNEL_COLORS: Record<string, { dot: string; unread: number }> = {
    "Marème Ndiaye":  { dot: "bg-green-500",  unread: 2 },
    "Kofi Atta":      { dot: "bg-pink-500",   unread: 1 },
    "Aminata Sy":     { dot: "bg-blue-500",   unread: 0 },
    "Oumar Touré":    { dot: "bg-green-500",  unread: 0 },
};

function MockInbox({ tr }: { tr: MockInboxTr }) {
    const unreadCount = tr.conversations.filter(c => (CHANNEL_COLORS[c.name]?.unread ?? 0) > 0).length;
    return (
        <div className="rounded-2xl border border-border bg-background shadow-xl overflow-hidden max-w-sm mx-auto">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <p className="font-bold font-serif text-foreground text-sm">{tr.title}</p>
                <span className="h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
            </div>
            <div className="divide-y divide-border">
                {tr.conversations.map(({ name, msg, time }) => {
                    const meta = CHANNEL_COLORS[name] ?? { dot: "bg-gray-400", unread: 0 };
                    return (
                        <div key={name} className={cn("flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer", meta.unread > 0 && "bg-primary/3")}>
                            <div className="relative flex-shrink-0">
                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-sm">
                                    {name[0]}
                                </div>
                                <div className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background", meta.dot)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className={cn("text-sm font-semibold text-foreground truncate", meta.unread > 0 && "font-bold")}>{name}</p>
                                    <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">{time}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{msg}</p>
                            </div>
                            {meta.unread > 0 && (
                                <div className="h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{meta.unread}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PricingCard({
    name, price, period, description, features, missing, cta, ctaHref, variant, badge
}: {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    missing: string[];
    cta: string;
    ctaHref: string;
    variant: "default" | "featured" | "enterprise";
    badge?: string;
}) {
    const isFeatured = variant === "featured";
    return (
        <div className={cn(
            "rounded-2xl border p-7 flex flex-col gap-6 relative",
            isFeatured
                ? "border-primary shadow-2xl shadow-primary/15 bg-background scale-[1.03]"
                : "border-border bg-background"
        )}>
            {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-md">{badge}</span>
                </div>
            )}
            <div>
                <p className="font-bold text-muted-foreground text-sm uppercase tracking-wider mb-3">{name}</p>
                <p className="text-3xl font-bold font-serif text-foreground">{price}</p>
                <p className="text-sm text-muted-foreground mt-1">{period}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            <ul className="space-y-2.5 flex-1">
                {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        {f}
                    </li>
                ))}
                {missing.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground/60 line-through">
                        <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>
            <Link href={ctaHref} className="block">
                <Button className={cn(
                    "w-full rounded-xl font-semibold h-11",
                    isFeatured
                        ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                )}>
                    {cta}
                </Button>
            </Link>
        </div>
    );
}
