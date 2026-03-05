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
import { ModeToggle } from "@/components/mode-toggle";
import { HomepageLightMode } from "@/components/HomepageLightMode";

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
        <div className="flex flex-col min-h-screen bg-background text-foreground pb-[72px] md:pb-0">
            <HomepageLightMode />

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
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="hidden md:flex items-center gap-2">
                            <LanguageSwitcher />
                            <ModeToggle />
                        </div>
                        <Link href="/auth/login" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
                            {tNav("login")}
                        </Link>
                        <Link href="/auth/signup">
                            <Button className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold px-4 md:px-5 py-2 shadow-md shadow-primary/20 text-sm">
                                {tNav("freeTrial")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── Hero ──────────────────────────────── */}
            <section className="pt-24 pb-10 md:pt-52 md:pb-24 px-4 md:px-6 relative overflow-hidden">
                {/* Background accents */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-background to-amber-50/30 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 -z-10" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/8 rounded-full blur-[140px] -z-10 translate-x-1/3 -translate-y-1/3" />

                <div className="container mx-auto max-w-4xl text-center space-y-4 md:space-y-7">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {t("hero.badge")}
                    </div>

                    <h1 className="text-[36px] md:text-[68px] font-bold tracking-tight text-secondary font-serif leading-[1.1] md:leading-[1.08]">
                        {t("hero.title1")}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-amber-500">
                            {t("hero.title2")}
                        </span>
                    </h1>

                    <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t("hero.subtitle")}
                    </p>

                    <div className="hidden sm:flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
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

                    <p className="hidden sm:block text-xs text-muted-foreground pt-1">
                        {t("hero.free")}
                    </p>

                    {/* Mobile secondary link (demo) */}
                    <div className="sm:hidden">
                        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            {t("hero.demo")} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>

                    {/* Arcade embed */}
                    <div className="pt-4 md:pt-20 w-full max-w-5xl mx-auto">
                        <div className="relative rounded-xl md:rounded-2xl border-2 border-border/60 bg-card shadow-[0_30px_80px_-20px_rgba(234,88,12,0.18)] overflow-hidden">
                            <div dangerouslySetInnerHTML={{ __html: heroEmbed }} />
                        </div>
                        <p className="mt-4 text-center text-xs md:text-sm text-muted-foreground">
                            {t("hero.demoNote")}{" "}
                            <Link href="/tutoriels" className="text-primary hover:underline font-medium">
                                {t("hero.demoLink")}
                            </Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Trust bar ─────────────────────────── */}
            <div className="py-6 md:py-10 border-y border-border/50 bg-muted/20">
                <div className="container mx-auto px-6">
                    <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">{t("trust.label")}</p>
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-50 hover:opacity-80 transition-opacity duration-500">
                        {["Chez Fatou", "Dakar Catering", "Teranga Events", "Saveurs d'Afrik", "Le Roi du Thiébou"].map(name => (
                            <span key={name} className="text-lg font-bold font-serif text-secondary">{name}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Problem section ───────────────────── */}
            <section id="probleme" className="py-12 md:py-24 px-4 md:px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-8 md:mb-16 space-y-3">
                        <h2 className="text-2xl md:text-4xl font-bold font-serif text-secondary">
                            {t("problem.title")}
                        </h2>
                        <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto">
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
            <section id="fonctionnalites" className="py-12 md:py-24 px-4 md:px-6 bg-card border-y border-border">
                <div className="container mx-auto max-w-6xl">

                    {/* Section header */}
                    <div className="text-center mb-8 md:mb-16">
                        <h2 className="text-2xl md:text-4xl font-bold font-serif text-secondary">{t("features.moreTitle")}</h2>
                        <p className="text-sm md:text-lg text-muted-foreground mt-3 max-w-xl mx-auto">{t("features.moreSubtitle")}</p>
                    </div>

                    {/* ── MOBILE: horizontal snap carousel ── */}
                    <div className="md:hidden">
                        {/* Swipeable phone frames */}
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 no-scrollbar -mx-4 px-4">
                            {/* F1 — Orders */}
                            <div className="snap-center flex-shrink-0 w-[72vw] flex flex-col items-center gap-3">
                                <PhoneMockup render={(compact) => (
                                    <MockOrderCard tr={t.raw("mocks.orderCard") as MockOrderCardTr} compact={compact} />
                                )} />
                                <FeaturePill icon={<ShoppingCart className="h-3 w-3" />} label={t("features.orders.pill")} />
                            </div>
                            {/* F2 — Calendar */}
                            <div className="snap-center flex-shrink-0 w-[72vw] flex flex-col items-center gap-3">
                                <PhoneMockup render={(compact) => (
                                    <MockCalendar tr={t.raw("mocks.calendar") as MockCalendarTr} compact={compact} />
                                )} />
                                <FeaturePill icon={<CalendarDays className="h-3 w-3" />} label={t("features.calendar.pill")} />
                            </div>
                            {/* F3 — Inbox */}
                            <div className="snap-center flex-shrink-0 w-[72vw] flex flex-col items-center gap-3">
                                <PhoneMockup render={(compact) => (
                                    <MockInbox tr={t.raw("mocks.inbox") as MockInboxTr} compact={compact} />
                                )} />
                                <FeaturePill icon={<MessageSquare className="h-3 w-3" />} label={t("features.inbox.pill")} />
                            </div>
                        </div>

                        {/* Scroll hint dots */}
                        <div className="flex justify-center gap-1.5 mt-3 mb-8">
                            <div className="w-5 h-1.5 rounded-full bg-primary" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25" />
                        </div>

                        {/* Feature details — compact stacked cards, text only */}
                        <div className="space-y-3">
                            {/* F1 */}
                            <div className="bg-background border border-border rounded-2xl p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground font-serif">{t("features.orders.title")}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{t("features.orders.body")}</p>
                                <ul className="space-y-1">
                                    {(t.raw("features.orders.items") as string[]).slice(0, 3).map((item: string) => (
                                        <li key={item} className="flex items-center gap-2 text-xs text-foreground">
                                            <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />{item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* F2 */}
                            <div className="bg-background border border-border rounded-2xl p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground font-serif">{t("features.calendar.title")}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{t("features.calendar.body")}</p>
                                <ul className="space-y-1">
                                    {(t.raw("features.calendar.items") as string[]).slice(0, 3).map((item: string) => (
                                        <li key={item} className="flex items-center gap-2 text-xs text-foreground">
                                            <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />{item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* F3 */}
                            <div className="bg-background border border-border rounded-2xl p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground font-serif">{t("features.inbox.title")}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{t("features.inbox.body")}</p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {["WhatsApp", "Instagram", "Email", "Messenger"].map(ch => (
                                        <span key={ch} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">{ch}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── DESKTOP: classic 2-col sections ── */}
                    <div className="hidden md:block space-y-24">
                        {/* F1: Commandes & Devis */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <FeaturePill icon={<ShoppingCart className="h-3.5 w-3.5" />} label={t("features.orders.pill")} />
                                <h3 className="text-4xl font-bold font-serif text-secondary leading-tight">{t("features.orders.title")}</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed">{t("features.orders.body")}</p>
                                <ul className="space-y-3">
                                    {(t.raw("features.orders.items") as string[]).map((item: string) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                                            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <PhoneMockup render={(compact) => (
                                <MockOrderCard tr={t.raw("mocks.orderCard") as MockOrderCardTr} compact={compact} />
                            )} />
                        </div>

                        {/* F2: Calendrier */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <PhoneMockup render={(compact) => (
                                    <MockCalendar tr={t.raw("mocks.calendar") as MockCalendarTr} compact={compact} />
                                )} />
                            </div>
                            <div className="space-y-6">
                                <FeaturePill icon={<CalendarDays className="h-3.5 w-3.5" />} label={t("features.calendar.pill")} />
                                <h3 className="text-4xl font-bold font-serif text-secondary leading-tight">{t("features.calendar.title")}</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed">{t("features.calendar.body")}</p>
                                <ul className="space-y-3">
                                    {(t.raw("features.calendar.items") as string[]).map((item: string) => (
                                        <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                                            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />{item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* F3: Messagerie unifiée */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <FeaturePill icon={<MessageSquare className="h-3.5 w-3.5" />} label={t("features.inbox.pill")} />
                                <h3 className="text-4xl font-bold font-serif text-secondary leading-tight">{t("features.inbox.title")}</h3>
                                <p className="text-muted-foreground text-lg leading-relaxed">{t("features.inbox.body")}</p>
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
                            <PhoneMockup render={(compact) => (
                                <MockInbox tr={t.raw("mocks.inbox") as MockInboxTr} compact={compact} />
                            )} />
                        </div>
                    </div>

                    {/* F4-F7: Secondary features grid */}
                    <div className="mt-12 md:mt-24">
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
            <section className="py-12 md:py-24 px-4 md:px-6">
                <div className="container mx-auto max-w-3xl text-center space-y-16">
                    <div className="space-y-3">
                        <h2 className="text-2xl md:text-4xl font-bold font-serif text-secondary">{t("howItWorks.title")}</h2>
                        <p className="text-muted-foreground text-sm md:text-lg">{t("howItWorks.subtitle")}</p>
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
            <section className="py-12 md:py-24 px-4 md:px-6 bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 border-y border-emerald-100 dark:border-emerald-900/30">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                                <Download className="h-3.5 w-3.5" />
                                {t("import.badge")}
                            </div>
                            <h3 className="text-2xl md:text-4xl font-bold font-serif text-secondary leading-tight">
                                {t("import.title")}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed text-sm md:text-lg">
                                {t("import.body")}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {(t.raw("import.items") as string[]).map(item => (
                                <div key={item} className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-border shadow-sm hover:shadow-md transition-shadow text-sm font-semibold text-foreground text-center">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                        <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pricing ───────────────────────────── */}
            <section id="tarifs" className="py-12 md:py-24 px-4 md:px-6 bg-card border-y border-border">
                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-8 md:mb-16 space-y-3">
                        <h2 className="text-2xl md:text-4xl font-bold font-serif text-secondary">
                            {t("pricing.title")}
                        </h2>
                        <p className="text-muted-foreground text-sm md:text-lg">
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
                            note={t("pricing.premium.earlyAdopter")}
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
            <section id="testimonials" className="py-12 md:py-24 px-4 md:px-6 bg-secondary text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
                <div className="container mx-auto max-w-3xl text-center relative z-10 space-y-12">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold">{t("testimonials.title")}</h2>
                    <div className="bg-white/10 backdrop-blur-md p-10 rounded-2xl border border-white/10 space-y-6">
                        <div className="flex items-center justify-center gap-1">
                            {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
                        </div>
                        <p className="text-base md:text-xl italic font-serif leading-relaxed">
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
            <section className="py-16 md:py-28 px-4 md:px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-amber-50/20 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 -z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/6 rounded-full blur-[120px] -z-10" />
                <div className="container mx-auto max-w-2xl text-center space-y-8">
                    <h2 className="text-2xl md:text-5xl font-bold font-serif text-secondary leading-tight">
                        {t("cta.title")}
                    </h2>
                    <p className="text-sm md:text-lg text-muted-foreground">
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

            {/* ── Floating CTA (mobile only) ─────────── */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border shadow-2xl px-4 py-3">
                <Link href="/auth/signup" className="block">
                    <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        {tNav("freeTrial")} <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
                <p className="text-center text-[11px] text-muted-foreground mt-1.5">{t("hero.free")}</p>
            </div>

            {/* ── Footer ────────────────────────────── */}
            <footer className="py-10 md:py-16 bg-muted/20 border-t border-border">
                <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-4 gap-8 md:gap-12">
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
                <div className="container mx-auto px-4 md:px-6 pt-8 mt-8 border-t border-border text-center text-xs text-muted-foreground">
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

function PhoneMockup({ render }: { render: (compact: boolean) => React.ReactNode }) {
    return (
        <>
            {/* Mobile: full iPhone mockup */}
            <div className="md:hidden mx-auto w-[240px]">
                {/* Phone shell — dark bezel */}
                <div className="relative bg-gray-900 dark:bg-zinc-800 rounded-[3rem] p-[4px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
                    {/* Volume buttons (left) */}
                    <div className="absolute -left-[5px] top-[72px] w-[5px] h-6 bg-gray-700 dark:bg-zinc-600 rounded-l-full" />
                    <div className="absolute -left-[5px] top-[106px] w-[5px] h-8 bg-gray-700 dark:bg-zinc-600 rounded-l-full" />
                    <div className="absolute -left-[5px] top-[148px] w-[5px] h-8 bg-gray-700 dark:bg-zinc-600 rounded-l-full" />
                    {/* Power button (right) */}
                    <div className="absolute -right-[5px] top-[110px] w-[5px] h-14 bg-gray-700 dark:bg-zinc-600 rounded-r-full" />

                    {/* Screen */}
                    <div className="rounded-[2.7rem] overflow-hidden bg-background">
                        {/* Dynamic Island / notch */}
                        <div className="relative flex items-center justify-between bg-background px-4 pt-3 pb-1">
                            <span className="text-[9px] font-semibold text-foreground/50 tabular-nums">9:41</span>
                            {/* Dynamic Island pill */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-16 h-4 bg-gray-900 dark:bg-black rounded-full" />
                            <div className="flex items-center gap-1">
                                {/* Signal bars */}
                                <div className="flex gap-px items-end h-2.5">
                                    <div className="w-px h-1 bg-foreground/40 rounded-full" />
                                    <div className="w-px h-1.5 bg-foreground/40 rounded-full" />
                                    <div className="w-px h-2 bg-foreground/40 rounded-full" />
                                    <div className="w-px h-2.5 bg-foreground/40 rounded-full" />
                                </div>
                                {/* Battery */}
                                <div className="flex items-center gap-px">
                                    <div className="w-4 h-2 border border-foreground/35 rounded-[2px] relative">
                                        <div className="absolute right-[-2.5px] top-1/2 -translate-y-1/2 w-[2.5px] h-1 bg-foreground/30 rounded-r-full" />
                                        <div className="absolute inset-[1.5px] right-[1.5px] bg-foreground/45 rounded-[1px]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* App content */}
                        {render(true)}

                        {/* Home indicator */}
                        <div className="flex justify-center pt-1 pb-2 bg-background">
                            <div className="w-20 h-1 rounded-full bg-foreground/20" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Desktop: normal rendering */}
            <div className="hidden md:block">{render(false)}</div>
        </>
    );
}

function MockOrderCard({ tr, compact }: { tr: MockOrderCardTr; compact?: boolean }) {
    if (compact) return (
        <div className="bg-background">
            {/* App top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground">Devis</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{tr.status}</span>
            </div>
            {/* Order hero */}
            <div className="px-4 py-3 bg-gradient-to-b from-primary/5 to-transparent border-b border-border/40">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{tr.label}</p>
                <p className="font-bold text-foreground font-serif text-sm leading-tight">{tr.event}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{tr.date}</p>
            </div>
            {/* Items */}
            <div className="px-4 py-2.5 space-y-1.5">
                {tr.items.map(({ name, qty, price }) => (
                    <div key={name} className="flex items-center justify-between">
                        <span className="text-[11px] text-foreground font-medium">{name} <span className="text-muted-foreground font-normal">{qty}</span></span>
                        <span className="text-[11px] text-muted-foreground font-mono">{price}</span>
                    </div>
                ))}
            </div>
            {/* Total bar */}
            <div className="mx-3 mb-3 bg-primary/8 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{tr.total}</p>
                    <p className="font-bold text-primary text-base font-mono leading-tight">{tr.totalAmount}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{tr.deposit}</p>
                    <p className="text-[11px] font-semibold text-emerald-600">{tr.depositAmount}</p>
                </div>
            </div>
        </div>
    );

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

function MockCalendar({ tr, compact }: { tr: MockCalendarTr; compact?: boolean }) {
    const cells = [
        { label: "1", load: 0 }, { label: "2", load: 0 }, { label: "3", load: 75 },
        { label: "4", load: 0 }, { label: "5", load: 0 }, { label: "6", load: 100, event: true },
        { label: "7", load: 0 }, { label: "8", load: 0 }, { label: "9", load: 0 },
        { label: "10", load: 40 }, { label: "11", load: 0 }, { label: "12", load: 0 },
        { label: "13", load: 100, event: true }, { label: "14", load: 0 }, { label: "15", load: 0 },
        { label: "16", load: 0 }, { label: "17", load: 60 }, { label: "18", load: 0 },
        { label: "19", load: 0 }, { label: "20", load: 100, event: true }, { label: "21", load: 0 },
    ];

    if (compact) return (
        <div className="bg-background">
            {/* App top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground">Agenda</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">{tr.eventsCount}</span>
            </div>
            {/* Month header */}
            <div className="px-4 pt-2.5 pb-1.5">
                <p className="font-bold font-serif text-foreground text-sm">{tr.month}</p>
            </div>
            {/* Day labels */}
            <div className="grid grid-cols-7 px-3 mb-0.5">
                {tr.days.map((d, i) => <div key={i} className="text-center text-[8px] font-bold text-muted-foreground py-0.5">{d}</div>)}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 px-3">
                {cells.map(({ label, load, event }) => (
                    <div key={label} className={cn(
                        "aspect-square rounded-md flex flex-col items-center justify-center text-[9px] font-medium relative overflow-hidden",
                        load === 0 ? "text-muted-foreground" :
                        load === 100 ? "bg-primary/15 text-primary font-bold border border-primary/30" :
                        "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    )}>
                        {label}
                        {load > 0 && load < 100 && (
                            <div className="absolute bottom-0.5 left-0.5 right-0.5 h-[2px] rounded-full bg-amber-200 dark:bg-amber-800">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${load}%` }} />
                            </div>
                        )}
                        {event && <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-primary" />}
                    </div>
                ))}
            </div>
            {/* Upcoming events */}
            <div className="px-3 pb-3 mt-2.5 space-y-1.5">
                {tr.events.map(({ name, date }) => (
                    <div key={name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50">
                        <div className="w-1 h-6 rounded-full bg-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate text-[10px]">{name}</p>
                            <p className="text-muted-foreground text-[9px]">{date}</p>
                        </div>
                        <span className="text-[8px] px-1 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold flex-shrink-0">{tr.full}</span>
                    </div>
                ))}
            </div>
        </div>
    );

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

function MockInbox({ tr, compact }: { tr: MockInboxTr; compact?: boolean }) {
    const unreadCount = tr.conversations.filter(c => (CHANNEL_COLORS[c.name]?.unread ?? 0) > 0).length;

    if (compact) return (
        <div className="bg-background overflow-hidden">
            {/* App top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground">{tr.title}</span>
                </div>
                {unreadCount > 0 && (
                    <span className="h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>
                )}
            </div>
            {/* Conversations */}
            <div className="divide-y divide-border/60">
                {tr.conversations.map(({ name, msg, time }) => {
                    const meta = CHANNEL_COLORS[name] ?? { dot: "bg-gray-400", unread: 0 };
                    return (
                        <div key={name} className={cn("flex items-center gap-2.5 px-3 py-2.5", meta.unread > 0 && "bg-primary/4")}>
                            <div className="relative flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-xs">
                                    {name[0]}
                                </div>
                                <div className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-background", meta.dot)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <p className={cn("text-[11px] text-foreground truncate", meta.unread > 0 ? "font-bold" : "font-semibold")}>{name}</p>
                                    <span className="text-[9px] text-muted-foreground ml-1 flex-shrink-0">{time}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{msg}</p>
                            </div>
                            {meta.unread > 0 && (
                                <div className="h-3.5 w-3.5 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">{meta.unread}</div>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Bottom tab bar simulation */}
            <div className="flex items-center justify-around border-t border-border/50 py-2 px-2 bg-background">
                {[
                    { label: "Accueil", active: false },
                    { label: "Devis", active: false },
                    { label: "Agenda", active: false },
                    { label: "Chat", active: true },
                ].map(({ label, active }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                        <div className={cn("w-4 h-4 rounded", active ? "bg-primary/20" : "bg-muted")} />
                        <span className={cn("text-[8px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );

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
    name, price, period, description, features, missing, cta, ctaHref, variant, badge, note
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
    note?: string;
}) {
    const isFeatured = variant === "featured";
    return (
        <div className={cn(
            "rounded-2xl border p-7 flex flex-col gap-6 relative",
            isFeatured
                ? "border-primary shadow-2xl shadow-primary/15 bg-background md:scale-[1.03]"
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
            {note && (
                <p className="text-xs text-primary/80 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 leading-relaxed">
                    {note}
                </p>
            )}
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
