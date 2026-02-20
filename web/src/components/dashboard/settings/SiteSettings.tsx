"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
    Save, Loader2, GripVertical, Plus, Trash2,
    LayoutList, BookOpen, CalendarDays, Image as ImageIcon, Star, MessageCircle
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
import { ContactSection } from "@/components/storefront/ContactSection";
import { CartProvider } from "@/context/CartContext";
import { Smartphone } from "lucide-react";

interface SiteSettingsProps {
    org: any;
    settings: any;
    products: any[];
}


const SECTION_ICONS: Record<string, any> = {
    menu: BookOpen, about: LayoutList, services: CalendarDays,
    gallery: ImageIcon, testimonials: Star, contact: MessageCircle,
};

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

export function SiteSettings({ org, settings, products }: SiteSettingsProps) {
    const [loading, startTransition] = useTransition();
    const router = useRouter();

    // Sections
    const [sections, setSections] = useState<StorefrontSection[]>(
        settings?.sections || DEFAULT_SECTIONS
    );

    // Hero
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

    // ── Preview derivation ──
    const previewSettings = {
        ...settings,
        sections,
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
            case 'menu': return <MenuSection products={products} currency={previewSettings.currency || "EUR"} />;
            case 'about': return <AboutSection settings={previewSettings} />;
            case 'services': return <ServicesSection settings={previewSettings} />;
            case 'gallery': return <GallerySection settings={previewSettings} />;
            case 'testimonials': return <TestimonialsSection settings={previewSettings} />;
            case 'contact': return <ContactSection settings={previewSettings} />;
            default: return null;
        }
    };

    const handleSubmit = () => {
        startTransition(async () => {
            const payload = {
                orgId: org.id,
                sections,
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
            else { toast.success("Site mis à jour !"); router.refresh(); }
        });
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8 items-start relative pb-12">
            {/* ── Left: Editors ── */}
            <div className="w-full xl:w-1/2 space-y-5">
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

                {/* Hero */}
                <Block title="Haut de page (Hero)" icon={ImageIcon}>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Image de fond</Label>
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

                {/* Save */}
                <div className="flex justify-end sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 border-t border-border rounded-xl shadow-lg z-10">
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2 rounded-full px-8">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Enregistrer le site
                    </Button>
                </div>
            </div>

            {/* ── Right: Live Preview ── */}
            <div className="hidden xl:flex w-full xl:w-1/2 sticky top-6 h-[calc(100vh-theme(spacing.12))] items-center justify-center">
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
                                        <div className="min-h-full bg-background font-sans text-foreground pb-20">
                                            {/* Scaling Wrapper for Font Sizing if needed, or just let it be natural desktop size */}

                                            {/* Navbar Desktop */}
                                            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 h-16 flex items-center justify-between px-12">
                                                <span className="font-bold text-xl">{org.name}</span>
                                                <div className="flex gap-6 items-center">
                                                    <span className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors">Accueil</span>
                                                    <span className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors">Notre Menu</span>
                                                    <span className="text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer transition-colors">Le Chef</span>
                                                    <Button size="sm" className="rounded-full px-6">Réserver</Button>
                                                </div>
                                            </div>

                                            <div className="p-12 pb-0 max-w-7xl mx-auto">
                                                {/* Hero */}
                                                <Hero orgName={org.name} settings={previewSettings} />
                                            </div>

                                            <div className="space-y-0 divide-y divide-border/30 px-12 pb-20 max-w-7xl mx-auto">
                                                {sections.filter(s => s.enabled).map(sec => (
                                                    <div key={sec.id} className="py-0">
                                                        <PreviewComponent section={sec} />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Footer Mockup */}
                                            <div className="bg-zinc-950 text-white py-12 px-12 mt-12">
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
        </div>
    );
}
