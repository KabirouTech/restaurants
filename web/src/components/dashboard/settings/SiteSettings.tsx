"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
    Save, Loader2, GripVertical, Plus, Trash2,
    LayoutList, BookOpen, CalendarDays, Image as ImageIcon, Star, MessageCircle, Palette, Sparkles, Lock, CheckCircle2, Zap, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateSiteSettingsAction } from "@/actions/site-settings";
import { DEFAULT_SECTIONS, DEFAULT_SERVICES, DEFAULT_TESTIMONIALS } from "@/lib/storefront-types";
import type { StorefrontSection, ServiceItem, Testimonial } from "@/lib/storefront-types";
import { ImageUpload } from "@/components/ImageUpload";
import { cn } from "@/lib/utils";
import { Hero } from "@/components/storefront/Hero";
import { MenuSection } from "@/components/storefront/MenuSection";
import { AboutSection } from "@/components/storefront/AboutSection";
import { ServicesSection } from "@/components/storefront/ServicesSection";
import { GallerySection } from "@/components/storefront/GallerySection";
import { TestimonialsSection } from "@/components/storefront/TestimonialsSection";
import { SettingsSavePortal } from "./SettingsSavePortal";
import { ContactSection } from "@/components/storefront/ContactSection";
import { CartProvider } from "@/context/CartContext";
import { UpgradeDialog } from "@/components/ui/upgrade-prompt";
import {
    STOREFRONT_TEMPLATE_OPTIONS,
    type StorefrontTemplate,
    resolveStorefrontTemplate,
} from "@/lib/storefront-templates";

interface SiteSettingsProps {
    org: any;
    settings: any;
    products: any[];
    currentPlan: "free" | "premium" | "enterprise";
}


const SECTION_ICONS: Record<string, any> = {
    menu: BookOpen, about: LayoutList, services: CalendarDays,
    gallery: ImageIcon, testimonials: Star, contact: MessageCircle,
};

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

function getTemplateCanvasClass(template: StorefrontTemplate): string {
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

function getPreviewNavClass(template: StorefrontTemplate): string {
    if (template === "bistro") {
        return "sticky top-0 z-50 bg-zinc-900/90 backdrop-blur-md border-b border-white/10 h-16 flex items-center justify-between px-12 text-zinc-100";
    }
    if (template === "catering") {
        return "sticky top-4 z-50 mx-8 rounded-[18px] bg-white/95 backdrop-blur-md border border-emerald-100 shadow-md h-14 flex items-center justify-between px-8 text-slate-900";
    }
    if (template === "restaurant") {
        return "sticky top-0 z-50 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100 h-16 flex items-center justify-between px-12 text-rose-950";
    }
    return "sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 flex items-center justify-between px-12";
}

function getPreviewFooterClass(template: StorefrontTemplate): string {
    if (template === "bistro") {
        return "bg-black text-zinc-100 py-12 px-12 mt-12";
    }
    if (template === "catering") {
        return "bg-slate-900 text-slate-100 py-12 px-12 mt-12";
    }
    if (template === "restaurant") {
        return "bg-rose-950 text-rose-50 py-12 px-12 mt-12";
    }
    return "bg-zinc-950 text-white py-12 px-12 mt-12";
}

// ── Section toggle manager ────────────────────────────────────────────────────

function SectionsManager({ sections, onChange }: {
    sections: StorefrontSection[];
    onChange: (s: StorefrontSection[]) => void;
}) {
    const toggle = (id: string) => {
        onChange(sections.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
    };

    return (
        <div className="space-y-2">
            {sections.map((sec) => {
                const Icon = SECTION_ICONS[sec.id] || LayoutList;
                return (
                    <div
                        key={sec.id}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-xl border transition-colors",
                            sec.enabled ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                            <div className={cn("p-1.5 rounded-md", sec.enabled ? "bg-primary/10" : "bg-muted")}>
                                <Icon className={cn("h-3.5 w-3.5", sec.enabled ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <span className={cn("text-sm font-medium", sec.enabled ? "text-foreground" : "text-muted-foreground")}>
                                {sec.label}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => toggle(sec.id)}
                            className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                sec.enabled ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                        >
                            <span className={cn(
                                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform",
                                sec.enabled ? "translate-x-4" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ── Services editor ───────────────────────────────────────────────────────────

function ServicesEditor({ services, onChange }: {
    services: ServiceItem[];
    onChange: (s: ServiceItem[]) => void;
}) {
    const update = (id: string, field: keyof ServiceItem, value: string) =>
        onChange(services.map((s) => s.id === id ? { ...s, [field]: value } : s));
    const remove = (id: string) => onChange(services.filter((s) => s.id !== id));
    const add = () => onChange([...services, {
        id: crypto.randomUUID(), emoji: "✨", title: "Nouvelle prestation", description: ""
    }]);

    return (
        <div className="space-y-3">
            {services.map((svc) => (
                <div key={svc.id} className="grid grid-cols-[40px_1fr_auto] gap-2 items-start border border-border/50 rounded-xl p-3 bg-muted/20">
                    <Input value={svc.emoji} onChange={(e) => update(svc.id, "emoji", e.target.value)}
                        className="text-center text-xl p-1 h-9 border-none bg-transparent" maxLength={2} />
                    <div className="space-y-1.5">
                        <Input value={svc.title} onChange={(e) => update(svc.id, "title", e.target.value)}
                            placeholder="Titre" className="h-8 text-sm" />
                        <Textarea value={svc.description} onChange={(e) => update(svc.id, "description", e.target.value)}
                            placeholder="Description..." rows={2} className="text-sm resize-none" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(svc.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 mt-0.5">
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={add} className="w-full gap-1.5 rounded-lg">
                <Plus className="h-3.5 w-3.5" /> Ajouter une prestation
            </Button>
        </div>
    );
}

// ── Testimonials editor ───────────────────────────────────────────────────────

function TestimonialsEditor({ testimonials, onChange }: {
    testimonials: Testimonial[];
    onChange: (t: Testimonial[]) => void;
}) {
    const update = (id: string, field: keyof Testimonial, value: any) =>
        onChange(testimonials.map((t) => t.id === id ? { ...t, [field]: value } : t));
    const remove = (id: string) => onChange(testimonials.filter((t) => t.id !== id));
    const add = () => onChange([...testimonials, {
        id: crypto.randomUUID(), name: "Prénom N.", role: "Client", text: "", rating: 5
    }]);

    return (
        <div className="space-y-3">
            {testimonials.map((t) => (
                <div key={t.id} className="border border-border/50 rounded-xl p-4 space-y-2.5 bg-muted/20">
                    <div className="grid grid-cols-2 gap-2">
                        <Input value={t.name} onChange={(e) => update(t.id, "name", e.target.value)}
                            placeholder="Prénom Nom" className="h-8 text-sm" />
                        <Input value={t.role} onChange={(e) => update(t.id, "role", e.target.value)}
                            placeholder="Mariée, juin 2024..." className="h-8 text-sm" />
                    </div>
                    <Textarea value={t.text} onChange={(e) => update(t.id, "text", e.target.value)}
                        placeholder="Leur témoignage..." rows={2} className="text-sm resize-none" />
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => update(t.id, "rating", n)}>
                                    <Star className="h-4 w-4" fill={n <= t.rating ? "currentColor" : "none"}
                                        style={{ color: n <= t.rating ? "hsl(var(--primary))" : "hsl(var(--border))" }} />
                                </button>
                            ))}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => remove(t.id)}
                            className="text-muted-foreground hover:text-destructive h-7 px-2 gap-1">
                            <Trash2 className="h-3 w-3" /> Supprimer
                        </Button>
                    </div>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={add} className="w-full gap-1.5 rounded-lg">
                <Plus className="h-3.5 w-3.5" /> Ajouter un témoignage
            </Button>
        </div>
    );
}

// ── Gallery editor ────────────────────────────────────────────────────────────

function GalleryEditor({ orgId, images, onChange }: {
    orgId: string;
    images: string[];
    onChange: (imgs: string[]) => void;
}) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = (url: string) => {
        if (url) onChange([...images, url]);
    };

    const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => remove(i)}
                                className="p-1.5 bg-destructive rounded-full text-white">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <ImageUpload
                name="galleryUpload"
                folder={`organizations/${orgId}/gallery`}
                onUpload={handleUpload}
            />
            <p className="text-xs text-muted-foreground">Les photos sont ajoutées une par une. Vous pouvez en ajouter autant que vous voulez.</p>
        </div>
    );
}

// ── Collapsible block ─────────────────────────────────────────────────────────

function Block({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <Card>
            <button type="button" onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-md"><Icon className="h-4 w-4 text-primary" /></div>
                    <span className="font-semibold text-sm">{title}</span>
                </div>
                <span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
            </button>
            {open && <CardContent className="pt-0 pb-4 px-4 border-t border-border/50 space-y-4">{children}</CardContent>}
        </Card>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

// ── Main ──────────────────────────────────────────────────────────────────────

export function SiteSettings({ org, settings, products, currentPlan }: SiteSettingsProps) {
    const [loading, startTransition] = useTransition();
    const router = useRouter();
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [storefrontTemplate, setStorefrontTemplate] = useState<StorefrontTemplate>(() =>
        resolveStorefrontTemplate(settings?.storefront_template, currentPlan)
    );
    const [previewTemplate, setPreviewTemplate] = useState<StorefrontTemplate>(() =>
        resolveStorefrontTemplate(settings?.storefront_template, currentPlan)
    );

    // Sections
    const [sections, setSections] = useState<StorefrontSection[]>(
        settings?.sections || DEFAULT_SECTIONS
    );

    // Appearance & Hero
    const [primaryColor, setPrimaryColor] = useState(settings?.primary_color || "#f4af25");
    const [heroTitle, setHeroTitle] = useState(settings?.hero_title || "Goûtez l'Essence de l'Épice Dorée");
    const [heroSubtitle, setHeroSubtitle] = useState(settings?.hero_subtitle || "Plat Signature");
    const [heroDescription, setHeroDescription] = useState(settings?.description || "Des saveurs authentiques créées avec passion.");
    const [heroImage, setHeroImage] = useState(settings?.hero_image || "");

    // About
    const [aboutTitle, setAboutTitle] = useState(settings?.about_title || "");
    const [aboutSubtitle, setAboutSubtitle] = useState(settings?.about_subtitle || "");
    const [aboutText1, setAboutText1] = useState(settings?.about_text1 || "");
    const [aboutText2, setAboutText2] = useState(settings?.about_text2 || "");
    const [aboutImage, setAboutImage] = useState(settings?.about_image || "");
    const [stat1Value, setStat1Value] = useState(settings?.stat1_value || "500+");
    const [stat1Label, setStat1Label] = useState(settings?.stat1_label || "Événements réalisés");
    const [stat2Value, setStat2Value] = useState(settings?.stat2_value || "98%");
    const [stat2Label, setStat2Label] = useState(settings?.stat2_label || "Clients satisfaits");
    const [stat3Value, setStat3Value] = useState(settings?.stat3_value || "15+");
    const [stat3Label, setStat3Label] = useState(settings?.stat3_label || "Années d'expérience");

    // Services
    const [servicesTitle, setServicesTitle] = useState(settings?.services_title || "");
    const [servicesSubtitle, setServicesSubtitle] = useState(settings?.services_subtitle || "");
    const [services, setServices] = useState<ServiceItem[]>(settings?.services || DEFAULT_SERVICES);

    // Gallery
    const [galleryTitle, setGalleryTitle] = useState(settings?.gallery_title || "");
    const [gallerySubtitle, setGallerySubtitle] = useState(settings?.gallery_subtitle || "");
    const [galleryImages, setGalleryImages] = useState<string[]>(settings?.gallery_images || []);

    // Testimonials
    const [testimonialsTitle, setTestimonialsTitle] = useState(settings?.testimonials_title || "");
    const [testimonialsSubtitle, setTestimonialsSubtitle] = useState(settings?.testimonials_subtitle || "");
    const [testimonials, setTestimonials] = useState<Testimonial[]>(settings?.testimonials || DEFAULT_TESTIMONIALS);

    // Contact section headings
    const [contactTitle, setContactTitle] = useState(settings?.contact_title || "");
    const [contactSubtitle, setContactSubtitle] = useState(settings?.contact_subtitle || "");

    // SEO
    const [metaTitle, setMetaTitle] = useState(settings?.meta_title || "");
    const [metaDescription, setMetaDescription] = useState(settings?.meta_description || "");

    const canUsePremiumTemplate = currentPlan !== "free";
    const activePreviewTemplate = previewTemplate;
    const isPreviewingUnlockedTemplate = activePreviewTemplate !== storefrontTemplate;
    const previewTemplateMeta = STOREFRONT_TEMPLATE_OPTIONS.find((option) => option.id === activePreviewTemplate);
    const isPreviewingPremiumTemplate = previewTemplateMeta?.premiumOnly === true;
    const activeTemplateMeta = STOREFRONT_TEMPLATE_OPTIONS.find((option) => option.id === storefrontTemplate);

    const previewDesign = (templateId: StorefrontTemplate) => {
        setPreviewTemplate(templateId);
    };

    const activateDesign = (templateId: StorefrontTemplate, premiumOnly: boolean) => {
        setPreviewTemplate(templateId);
        if (premiumOnly && !canUsePremiumTemplate) {
            setUpgradeOpen(true);
            return;
        }
        setStorefrontTemplate(templateId);
        toast.success("Design activé pour votre boutique.");
    };

    // ── Preview derivation ──
    const previewSettings = {
        ...settings,
        sections,
        storefront_template: activePreviewTemplate,
        primary_color: primaryColor,
        hero_title: heroTitle, hero_subtitle: heroSubtitle, description: heroDescription, hero_image: heroImage,
        about_title: aboutTitle, about_subtitle: aboutSubtitle, about_text1: aboutText1, about_text2: aboutText2, about_image: aboutImage,
        stat1_value: stat1Value, stat1_label: stat1Label, stat2_value: stat2Value, stat2_label: stat2Label, stat3_value: stat3Value, stat3_label: stat3Label,
        services_title: servicesTitle, services_subtitle: servicesSubtitle, services,
        gallery_title: galleryTitle, gallery_subtitle: gallerySubtitle, gallery_images: galleryImages,
        testimonials_title: testimonialsTitle, testimonials_subtitle: testimonialsSubtitle, testimonials,
        contact_title: contactTitle, contact_subtitle: contactSubtitle,
        org_id: org.id // Ensure ContactSection gets org_id
    };

    const PreviewComponent = ({ section }: { section: StorefrontSection }) => {
        switch (section.id) {
            case 'menu': return <MenuSection products={products} currency={previewSettings.currency || "EUR"} template={activePreviewTemplate} />;
            case 'about': return <AboutSection settings={previewSettings} />;
            case 'services': return <ServicesSection settings={previewSettings} />;
            case 'gallery': return <GallerySection settings={previewSettings} />;
            case 'testimonials': return <TestimonialsSection settings={previewSettings} />;
            case 'contact': return <ContactSection settings={previewSettings} />;
            default: return null;
        }
    };
    const previewSectionOrder: Record<string, number> = {
        services: 0,
        menu: 1,
        about: 2,
        testimonials: 3,
        gallery: 4,
        contact: 5,
    };
    const orderedPreviewSections = activePreviewTemplate === "catering"
        ? [...sections.filter((section) => section.enabled)].sort(
            (a, b) => (previewSectionOrder[a.id] ?? 99) - (previewSectionOrder[b.id] ?? 99)
        )
        : sections.filter((section) => section.enabled);

    const handleSubmit = () => {
        startTransition(async () => {
            const payload = {
                orgId: org.id,
                sections,
                storefrontTemplate,
                primaryColor, metaTitle, metaDescription,
                heroTitle, heroSubtitle, description: heroDescription, heroImage,
                aboutTitle, aboutSubtitle, aboutText1, aboutText2, aboutImage,
                stat1Value, stat1Label, stat2Value, stat2Label, stat3Value, stat3Label,
                servicesTitle, servicesSubtitle, services,
                galleryTitle, gallerySubtitle, galleryImages,
                testimonialsTitle, testimonialsSubtitle, testimonials,
                contactTitle, contactSubtitle,
            };
            const result = await updateSiteSettingsAction(payload);
            if (result?.error) toast.error(result.error);
            else {
                toast.success("Site mis à jour !");
                if (!canUsePremiumTemplate && isPreviewingUnlockedTemplate && isPreviewingPremiumTemplate) {
                    toast("Aperçu premium actif en prévisualisation. Le design publié reste celui du plan Free.");
                }
                router.refresh();
            }
        });
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8 items-start relative pb-12">
            {/* ── Left: Editors ── */}
            <div className="w-full xl:w-1/2 space-y-5">
                {/* Storefront template manager */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between gap-4 pb-3 border-b border-border mb-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg"><Palette className="h-4 w-4 text-primary" /></div>
                                <div>
                                    <p className="font-semibold text-sm">Shop des designs</p>
                                    <p className="text-xs text-muted-foreground">Prévisualisez chaque design avec vos vraies données.</p>
                                </div>
                            </div>
                            <span className={cn(
                                "text-xs font-semibold px-2.5 py-1 rounded-full border",
                                currentPlan === "free"
                                    ? "bg-slate-100 text-slate-700 border-slate-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                            )}>
                                {currentPlan === "free" ? "Plan Free" : "Plan Premium"}
                            </span>
                        </div>

                        {/* ── Compact template grid ── */}
                        <div className="grid grid-cols-4 gap-2">
                            {STOREFRONT_TEMPLATE_OPTIONS.map((template) => {
                                const selected = storefrontTemplate === template.id;
                                const previewed = activePreviewTemplate === template.id;
                                const locked = template.premiumOnly && !canUsePremiumTemplate;
                                return (
                                    <button
                                        key={template.id}
                                        type="button"
                                        className={cn(
                                            "relative group text-left rounded-lg border p-1.5 transition-all cursor-pointer",
                                            selected
                                                ? "border-primary ring-2 ring-primary/30"
                                                : previewed
                                                    ? "border-primary/50 ring-1 ring-primary/20"
                                                    : "border-border hover:border-primary/40",
                                        )}
                                        onClick={() => previewDesign(template.id)}
                                    >
                                        {/* Mini preview */}
                                        <div className={cn("h-14 rounded bg-gradient-to-br p-1.5", template.previewClassName)}>
                                            <div className={cn("h-full rounded border border-black/10 overflow-hidden", template.previewSurfaceClassName)}>
                                                <div className="h-2 border-b border-black/10 bg-black/5" />
                                                <div className="p-1 space-y-0.5">
                                                    <div className={cn("h-1.5 w-3/4 rounded-sm", template.previewPrimaryClassName)} />
                                                    <div className="flex gap-0.5">
                                                        <div className={cn("h-1 flex-1 rounded-sm", template.previewSecondaryClassName)} />
                                                        <div className={cn("h-1 flex-1 rounded-sm", template.previewSecondaryClassName)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Name + indicators */}
                                        <div className="mt-1.5 px-0.5">
                                            <p className="text-[11px] font-semibold leading-tight truncate">{template.name}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {selected && <CheckCircle2 className="h-2.5 w-2.5 text-primary shrink-0" />}
                                                {!selected && previewed && <Eye className="h-2.5 w-2.5 text-primary shrink-0" />}
                                                <span className="text-[9px] text-muted-foreground truncate">{template.audience}</span>
                                            </div>
                                        </div>
                                        {/* Lock badge */}
                                        {locked && (
                                            <span className="absolute top-1 right-1 rounded-full bg-amber-500 text-white p-0.5">
                                                <Lock className="h-2 w-2" />
                                            </span>
                                        )}
                                        {/* Premium dot */}
                                        {template.premiumOnly && !locked && (
                                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Detail panel for focused template ── */}
                        {(() => {
                            const focused = STOREFRONT_TEMPLATE_OPTIONS.find(t => t.id === activePreviewTemplate);
                            if (!focused) return null;
                            const selected = storefrontTemplate === focused.id;
                            const locked = focused.premiumOnly && !canUsePremiumTemplate;
                            return (
                                <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <p className="text-sm font-semibold truncate">{focused.name}</p>
                                            <span className={cn(
                                                "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border shrink-0",
                                                focused.premiumOnly
                                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                            )}>
                                                {focused.badge}
                                            </span>
                                        </div>
                                        {selected && (
                                            <span className="inline-flex items-center gap-1 text-primary text-[11px] font-semibold shrink-0">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Actif
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{focused.summary}</p>
                                    <div className="flex items-center gap-2">
                                        {selected ? (
                                            <Button type="button" size="sm" disabled className="flex-1 h-8 text-xs">
                                                Design actif
                                            </Button>
                                        ) : locked ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="flex-1 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                                                onClick={() => activateDesign(focused.id, focused.premiumOnly)}
                                            >
                                                <Lock className="h-3 w-3 mr-1" />
                                                Passer au Premium
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="flex-1 h-8 text-xs"
                                                onClick={() => activateDesign(focused.id, focused.premiumOnly)}
                                            >
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Activer ce design
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {!canUsePremiumTemplate && (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                <p className="text-xs text-amber-800">7 designs premium disponibles avec le plan Premium.</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="bg-amber-500 hover:bg-amber-600 text-white shrink-0 h-7 text-xs"
                                    onClick={() => setUpgradeOpen(true)}
                                >
                                    <Zap className="h-3 w-3 mr-1" />
                                    Upgrade
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sections manager */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-border mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg"><LayoutList className="h-4 w-4 text-primary" /></div>
                            <div>
                                <p className="font-semibold text-sm">Sections du site</p>
                                <p className="text-xs text-muted-foreground">Activez ou désactivez les sections de votre vitrine.</p>
                            </div>
                        </div>
                        <SectionsManager sections={sections} onChange={setSections} />
                    </CardContent>
                </Card>

                {/* Hero / Apparence */}
                <Block title="Apparence & Haut de page" icon={Palette}>
                    <div className="space-y-4">
                        <div className="space-y-1.5 flex flex-col">
                            <Label className="text-xs">Couleur principale</Label>
                            <div className="flex gap-3 items-center">
                                <div
                                    className="w-10 h-10 rounded-lg border border-border shadow-sm shrink-0"
                                    style={{ backgroundColor: primaryColor }}
                                />
                                <Input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="w-20 h-10 p-1 cursor-pointer bg-background"
                                />
                                <div className="text-xs text-muted-foreground font-mono">
                                    {primaryColor}
                                </div>
                            </div>
                        </div>

                        <hr className="border-border/50" />

                        <div className="space-y-1.5">
                            <Label className="text-xs">Image de fond (Hero)</Label>
                            <ImageUpload name="heroImage" defaultValue={heroImage}
                                folder={`organizations/${org.id}/hero`} onUpload={setHeroImage} />
                            <p className="text-[10px] text-muted-foreground">Format recommandé: Paysage, haute définition.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Badge / Surtitre</Label>
                            <Input value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="Plat Signature" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Grand Titre</Label>
                            <Input value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="Goûtez l'Essence..." />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Description</Label>
                            <Textarea value={heroDescription} onChange={e => setHeroDescription(e.target.value)} rows={2} placeholder="Des saveurs authentiques..." />
                        </div>
                    </div>
                </Block>

                {/* About */}
                <Block title="Notre Histoire — Contenu" icon={LayoutList}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Titre</Label>
                                <Input value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} placeholder="Notre Histoire" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Accroche</Label>
                                <Input value={aboutSubtitle} onChange={e => setAboutSubtitle(e.target.value)} placeholder="Depuis 2015..." />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Photo</Label>
                            <ImageUpload name="aboutImage" defaultValue={aboutImage}
                                folder={`organizations/${org.id}/about`} onUpload={setAboutImage} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Paragraphe 1</Label>
                            <Textarea value={aboutText1} onChange={e => setAboutText1(e.target.value)} rows={3} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Paragraphe 2</Label>
                            <Textarea value={aboutText2} onChange={e => setAboutText2(e.target.value)} rows={3} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                [stat1Value, setStat1Value, stat1Label, setStat1Label],
                                [stat2Value, setStat2Value, stat2Label, setStat2Label],
                                [stat3Value, setStat3Value, stat3Label, setStat3Label],
                            ].map(([val, setVal, lbl, setLbl], i) => (
                                <div key={i} className="space-y-1.5">
                                    <Label className="text-xs">Stat {i + 1}</Label>
                                    <Input value={val as string} onChange={e => (setVal as any)(e.target.value)} placeholder="500+" className="h-8 text-center text-sm font-bold" />
                                    <Input value={lbl as string} onChange={e => (setLbl as any)(e.target.value)} placeholder="Événements" className="h-7 text-xs" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Block>

                {/* Services */}
                <Block title="Événements & Prestations" icon={CalendarDays}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Titre de section</Label>
                                <Input value={servicesTitle} onChange={e => setServicesTitle(e.target.value)} placeholder="Nos Prestations" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Sous-titre</Label>
                                <Input value={servicesSubtitle} onChange={e => setServicesSubtitle(e.target.value)} placeholder="Sur mesure pour chaque occasion" />
                            </div>
                        </div>
                        <ServicesEditor services={services} onChange={setServices} />
                    </div>
                </Block>

                {/* Gallery */}
                <Block title="Galerie Photos" icon={ImageIcon}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Titre</Label>
                                <Input value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)} placeholder="Notre Galerie" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Sous-titre</Label>
                                <Input value={gallerySubtitle} onChange={e => setGallerySubtitle(e.target.value)} placeholder="Des réalisations..." />
                            </div>
                        </div>
                        <GalleryEditor orgId={org.id} images={galleryImages} onChange={setGalleryImages} />
                    </div>
                </Block>

                {/* Testimonials */}
                <Block title="Témoignages Clients" icon={Star}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Titre</Label>
                                <Input value={testimonialsTitle} onChange={e => setTestimonialsTitle(e.target.value)} placeholder="Ce que disent nos clients" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Sous-titre</Label>
                                <Input value={testimonialsSubtitle} onChange={e => setTestimonialsSubtitle(e.target.value)} placeholder="Des centaines d'événements..." />
                            </div>
                        </div>
                        <TestimonialsEditor testimonials={testimonials} onChange={setTestimonials} />
                    </div>
                </Block>

                {/* Contact section headings */}
                <Block title="Section Contact — Texte" icon={MessageCircle}>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Titre</Label>
                            <Input value={contactTitle} onChange={e => setContactTitle(e.target.value)} placeholder="Faisons Connaissance" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Sous-titre</Label>
                            <Input value={contactSubtitle} onChange={e => setContactSubtitle(e.target.value)} placeholder="Parlons de votre prochain événement." />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Les coordonnées (téléphone, email, adresse) se gèrent dans l'onglet <strong>Général</strong>.</p>
                </Block>

                {/* SEO */}
                <Block title="SEO & Référencement" icon={Sparkles}>
                    <div className="space-y-3">
                        <p className="text-xs text-muted-foreground mb-2">Optimisez comment votre site apparaît sur Google et les réseaux sociaux.</p>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Titre pour les moteurs de recherche (Meta Title)</Label>
                            <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Le site de mon entreprise" />
                            <p className="text-[10px] text-muted-foreground">Apparaît dans l'onglet du navigateur et les résultats Google (recommandé: 50-60 caractères).</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Description courte (Meta Description)</Label>
                            <Textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2} placeholder="Nous vous proposons..." />
                            <p className="text-[10px] text-muted-foreground">Apparaît sous le titre dans les résultats Google (recommandé: 150-160 caractères).</p>
                        </div>
                    </div>
                </Block>

                {/* Save Portal */}
                <SettingsSavePortal>
                    <Button onClick={handleSubmit} disabled={loading} size="lg" className="gap-2 shadow-sm rounded-lg bg-primary hover:bg-primary/90 hidden md:flex px-8">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Enregistrer le site
                    </Button>
                </SettingsSavePortal>

                {/* Mobile Fallback Save */}
                <div className="flex md:hidden sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 border-t border-border rounded-xl shadow-lg z-10 w-full">
                    <Button onClick={handleSubmit} disabled={loading} size="lg" className="gap-2 rounded-lg w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Enregistrer le site
                    </Button>
                </div>
            </div>

            {/* ── Right: Live Preview ── */}
            <div className="hidden xl:flex w-full xl:w-1/2 sticky top-[160px] h-[calc(100vh-190px)] items-center justify-center z-40">
                <div className="relative w-full max-w-[1000px] perspective-[2000px]">
                    {/* Monitor Stand */}
                    <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-32 h-20 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-lg shadow-xl z-0 transform -translate-y-4"></div>
                    <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-48 h-4 bg-zinc-900 rounded-full shadow-2xl z-0"></div>

                    {/* Monitor Bezel */}
                    <div className="relative bg-zinc-900 p-3 rounded-2xl shadow-2xl border border-zinc-700 z-10">
                        {/* Screen Area (16:10 Aspect Ratio) */}
                        <div className="relative aspect-[16/10] w-full bg-background rounded-md overflow-hidden ring-1 ring-white/10 group">

                            {/* Browser Header / OS Bar */}
                            <div className="h-6 bg-muted border-b flex items-center px-3 gap-2 sticky top-0 z-50">
                                <div className="flex gap-1.5 opacity-60">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                                <div className="flex-1 text-[10px] text-center font-mono text-zinc-400 select-none">
                                    restaurants.os/{org.slug}
                                </div>
                            </div>

                            {/* Scaled Content Container */}
                            <div className="w-full h-[calc(100%-24px)] overflow-hidden bg-background">
                                <div className="w-[200%] h-[200%] origin-top-left transform scale-[0.5] overflow-y-auto no-scrollbar">
                                    <CartProvider>
                                        <div
                                            className={cn(
                                                "min-h-full font-sans pb-20 selection:bg-primary/30 transition-colors",
                                                getTemplateCanvasClass(activePreviewTemplate)
                                            )}
                                            style={primaryColor ? { "--primary": hexToHsl(primaryColor) } as React.CSSProperties : {}}
                                        >
                                            {/* Scaling Wrapper for Font Sizing if needed, or just let it be natural desktop size */}

                                            {/* Navbar Desktop */}
                                            <div className={getPreviewNavClass(activePreviewTemplate)}>
                                                <span className={cn(
                                                    "font-bold text-xl",
                                                    activePreviewTemplate === "catering" && "text-emerald-900 font-outfit"
                                                )}>
                                                    {org.name}
                                                </span>
                                                <div className="flex gap-6 items-center">
                                                    <span className={cn(
                                                        "text-sm font-medium cursor-pointer transition-colors",
                                                        activePreviewTemplate === "bistro"
                                                            ? "text-zinc-300 hover:text-white"
                                                            : activePreviewTemplate === "catering"
                                                                ? "text-zinc-600 hover:text-emerald-700"
                                                                : "text-muted-foreground hover:text-primary"
                                                    )}>Accueil</span>
                                                    <span className={cn(
                                                        "text-sm font-medium cursor-pointer transition-colors",
                                                        activePreviewTemplate === "bistro"
                                                            ? "text-zinc-300 hover:text-white"
                                                            : activePreviewTemplate === "catering"
                                                                ? "text-zinc-600 hover:text-emerald-700"
                                                                : "text-muted-foreground hover:text-primary"
                                                    )}>Notre Menu</span>
                                                    <span className={cn(
                                                        "text-sm font-medium cursor-pointer transition-colors",
                                                        activePreviewTemplate === "bistro"
                                                            ? "text-zinc-300 hover:text-white"
                                                            : activePreviewTemplate === "catering"
                                                                ? "text-zinc-600 hover:text-emerald-700"
                                                                : "text-muted-foreground hover:text-primary"
                                                    )}>Le Chef</span>
                                                    <Button
                                                        size="sm"
                                                        className={cn(
                                                            "rounded-full px-6",
                                                            activePreviewTemplate === "catering"
                                                                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                                                                : ""
                                                        )}
                                                    >
                                                        {activePreviewTemplate === "catering" ? "Pantry" : "Reserver"}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-12 pb-0 max-w-7xl mx-auto">
                                                {/* Hero */}
                                                <Hero orgName={org.name} settings={previewSettings} template={activePreviewTemplate} />
                                            </div>

                                            <div className="space-y-0 divide-y divide-border/30 px-12 pb-20 max-w-7xl mx-auto">
                                                {orderedPreviewSections.map(sec => (
                                                    <div key={sec.id} className="py-0">
                                                        <PreviewComponent section={sec} />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Footer Mockup */}
                                            <div className={getPreviewFooterClass(activePreviewTemplate)}>
                                                <div className="grid grid-cols-4 gap-8 max-w-7xl mx-auto">
                                                    <div className="space-y-4">
                                                        <h3 className="font-bold text-lg">{org.name}</h3>
                                                        <p className="text-sm text-zinc-400">L'excellence gastronomique à portée de clic.</p>
                                                    </div>
                                                    <div className="space-y-4 col-span-2">
                                                        <h4 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">Liens</h4>
                                                        <div className="grid grid-cols-2 gap-2 text-sm text-zinc-300">
                                                            <span>Mentions légales</span>
                                                            <span>CGV</span>
                                                            <span>Confidentialité</span>
                                                            <span>Contact</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CartProvider>
                                </div>
                            </div>

                            {/* Reflection/Glass Effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-md" />
                        </div>

                        {/* Monitor Bottom Bezel Logo */}
                        <div className="h-6 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-zinc-800 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>

            <UpgradeDialog orgId={org.id} open={upgradeOpen} onOpenChange={setUpgradeOpen} />
        </div>
    );
}
