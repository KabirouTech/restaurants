import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, LayoutDashboard, MessageSquare, ShoppingCart, CalendarDays, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Restaurant OS - Propulsez votre cuisine avec la Teranga Digitale",
    description: "Simplifiez la gestion de votre activité traiteur.",
};

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">

            {/* Navbar - Glass + Culture */}
            <header className="fixed top-0 w-full border-b border-primary/10 bg-background/80 backdrop-blur-xl z-50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <ChefHat className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight font-serif text-secondary">
                            Restaurant<span className="text-primary">OS</span>
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <Link href="#features" className="hover:text-primary transition-colors">Fonctionnalités</Link>
                        <Link href="#testimonials" className="hover:text-primary transition-colors">Témoignages</Link>
                        <Link href="/auth/login" className="px-6 py-2 text-primary hover:text-primary/80 font-medium transition-colors">
                            Connexion
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/auth/signup">
                            <Button className="rounded-full bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                                Essai Gratuit
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section - Cultural Warmth */}
            <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden bg-gradient-to-b from-orange-50/50 to-transparent dark:from-background dark:to-background">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

                <div className="container mx-auto max-w-5xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold uppercase tracking-wide border border-orange-200 shadow-sm mx-auto">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        Conçu pour les Traiteurs Modernes
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-secondary font-serif leading-[1.1]">
                        L'excellence culinaire <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">sans le chaos administratif.</span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Concentrez-vous sur le goût, nous gérons le reste.
                        Devis, agenda, stock et relation client dans une application imprégnée de l'esprit de la Teranga.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <Link href="/auth/signup">
                            <Button size="lg" className="h-14 px-8 rounded-full text-lg bg-secondary hover:bg-secondary/90 text-white shadow-xl shadow-secondary/20 transition-all hover:scale-105">
                                Commencer maintenant <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg border-2 hover:bg-primary/5 hover:text-primary hover:border-primary transition-all">
                                Voir la Démo Live
                            </Button>
                        </Link>
                    </div>

                    {/* Hero Visual */}
                    <div className="pt-16 md:pt-24 relative w-full max-w-6xl mx-auto">
                        <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] group transition-all hover:shadow-[0_20px_60px_-15px_rgba(234,88,12,0.15)]">
                            {/* Visual Placeholder: Replace with generate_image later if needed */}
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
                                <div className="text-center opacity-40">
                                    <LayoutDashboard className="h-24 w-24 mx-auto text-primary mb-4" />
                                    <p className="font-serif italic text-2xl text-secondary">Tableau de Bord Intuitif</p>
                                </div>
                            </div>
                            {/* Overlay UI elements simulating dashboard */}
                            <div className="absolute top-8 left-8 right-8 bottom-0 bg-white shadow-lg rounded-t-xl border border-border p-6 grid grid-cols-3 gap-6 opacity-90 translate-y-4 group-hover:translate-y-2 transition-transform duration-500">
                                <div className="col-span-1 space-y-3">
                                    <div className="h-4 w-32 bg-primary/10 rounded"></div>
                                    <div className="h-24 w-full bg-primary/5 rounded-lg border border-primary/10"></div>
                                    <div className="h-24 w-full bg-secondary/5 rounded-lg border border-secondary/10"></div>
                                </div>
                                <div className="col-span-2 space-y-3">
                                    <div className="flex justify-between">
                                        <div className="h-4 w-48 bg-gray-100 rounded"></div>
                                        <div className="h-8 w-24 bg-primary text-white rounded-full flex items-center justify-center text-xs">Nouveau Devis</div>
                                    </div>
                                    <div className="h-48 w-full bg-gray-50 rounded-lg border border-dashed border-gray-200"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid - Warm & Spacious */}
            <section id="features" className="py-24 bg-white dark:bg-zinc-900/50">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-serif text-secondary">Tout est là, comme un bon Thiéboudienne.</h2>
                        <p className="text-lg text-muted-foreground">
                            Chaque ingrédient a été pensé pour les traiteurs qui veulent grandir tout en gardant une touche humaine.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<LayoutDashboard className="h-6 w-6" />}
                            title="Capacité Maîtrisée"
                            description="Sachez exactement si vous pouvez accepter ce mariage de 300 personnes sans sacrifier la qualité."
                            color="text-primary bg-primary/10"
                        />
                        <FeatureCard
                            icon={<MessageSquare className="h-6 w-6" />}
                            title="Inbox Unifiée"
                            description="WhatsApp, Instagram, Email. Tous vos clients au même endroit. Ne ratez plus jamais une commande."
                            color="text-purple-600 bg-purple-100"
                        />
                        <FeatureCard
                            icon={<ShoppingCart className="h-6 w-6" />}
                            title="Devis & Commandes"
                            description="Transformez une conversation en devis PDF élégant en 2 clics. Suivez les acomptes sans effort."
                            color="text-secondary bg-secondary/10"
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof / Culture */}
            <section className="py-24 bg-secondary text-white relative overflow-hidden">
                {/* African Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl font-serif font-bold mb-12">Ils cuisinent avec nous</h2>
                    <div className="flex flex-wrap justify-center gap-12 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Logos placeholder - replace with text for now */}
                        <span className="text-2xl font-bold font-serif">Chez Fatou</span>
                        <span className="text-2xl font-bold font-serif">Dakar Catering</span>
                        <span className="text-2xl font-bold font-serif">Teranga Events</span>
                        <span className="text-2xl font-bold font-serif">Saveurs d'Afrik</span>
                    </div>

                    <div className="mt-20 max-w-2xl mx-auto bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                        <p className="text-xl italic font-serif leading-relaxed">
                            "Avant, je passais mes nuits sur WhatsApp pour gérer les commandes. Avec Restaurant OS, j'ai retrouvé le temps de créer de nouvelles recettes."
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary border-2 border-white"></div>
                            <div className="text-left">
                                <p className="font-bold">Aminata Diallo</p>
                                <p className="text-sm opacity-80">Fondatrice, Saveurs d'Afrik</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 bg-muted/30 border-t border-border">
                <div className="container mx-auto px-6 grid md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 font-bold text-xl text-secondary font-serif">
                            <ChefHat className="h-6 w-6 text-primary" />
                            Restaurant OS
                        </div>
                        <p className="text-muted-foreground max-w-xs leading-relaxed">
                            La plateforme tout-en-un pour les traiteurs qui veulent allier tradition et technologie.
                        </p>
                        <div className="flex gap-4">
                            {/* Social Icons Placeholder */}
                            <div className="h-8 w-8 rounded-full bg-secondary/10 hover:bg-secondary/20 transition-colors"></div>
                            <div className="h-8 w-8 rounded-full bg-secondary/10 hover:bg-secondary/20 transition-colors"></div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-6">Produit</h4>
                        <ul className="space-y-4 text-muted-foreground text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">Fonctionnalités</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Tarifs</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Pour les Traiteurs</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Pour les Restaurants</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-6">Entreprise</h4>
                        <ul className="space-y-4 text-muted-foreground text-sm">
                            <li><Link href="#" className="hover:text-primary transition-colors">À propos</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Mentions Légales</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-6 pt-12 mt-12 border-t border-border text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Restaurant OS Inc. Fait avec passion.
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className={cn("h-14 w-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300", color)}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground font-serif">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}
