"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Play, X } from "lucide-react";

interface Tutorial {
    id: string;
    title: string;
    description: string | null;
    embed_code: string;
    sort_order: number;
    created_at: string;
}

export function TutorielsClient({ tutorials }: { tutorials: Tutorial[] }) {
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filtered = tutorials.filter((t) => {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    });

    const selected = selectedId ? tutorials.find((t) => t.id === selectedId) : null;

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <header className="fixed top-0 w-full border-b border-primary/10 bg-background/80 backdrop-blur-xl z-50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo size="lg" href="/" className="text-secondary" />

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                        <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
                        <Link href="/sign-in" className="px-6 py-2 text-primary hover:text-primary/80 font-medium transition-colors">
                            Connexion
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/sign-up">
                            <Button className="rounded-full bg-primary hover:bg-primary/90 text-white font-medium px-6 py-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
                                Essai Gratuit
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-5xl">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
                        <ArrowLeft className="h-4 w-4" />
                        Retour à l&apos;accueil
                    </Link>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-secondary font-serif mb-4">
                        Tutoriels
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Apprenez à maîtriser Restaurant OS avec nos guides interactifs.
                    </p>

                    {/* Search */}
                    <div className="relative mb-10">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un tutoriel..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 h-12 rounded-full border-border bg-card shadow-sm text-base"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Selected tutorial embed */}
                    {selected && (
                        <div className="mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold font-serif text-foreground">{selected.title}</h2>
                                <button
                                    onClick={() => setSelectedId(null)}
                                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Fermer
                                </button>
                            </div>
                            {selected.description && (
                                <p className="text-muted-foreground">{selected.description}</p>
                            )}
                            <div
                                className="rounded-2xl border bg-background shadow-2xl overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: selected.embed_code }}
                            />
                        </div>
                    )}

                    {/* Tutorial cards grid */}
                    {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filtered.map((tutorial) => (
                                <button
                                    key={tutorial.id}
                                    onClick={() => setSelectedId(tutorial.id === selectedId ? null : tutorial.id)}
                                    className={`text-left bg-card rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 group ${
                                        tutorial.id === selectedId
                                            ? "border-orange-500 ring-2 ring-orange-500/20"
                                            : "border-border"
                                    }`}
                                >
                                    {/* Mini preview */}
                                    <div className="relative aspect-video bg-muted overflow-hidden pointer-events-none">
                                        <div
                                            className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                                            dangerouslySetInnerHTML={{ __html: tutorial.embed_code }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <div className="h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="h-5 w-5 text-orange-500 ml-0.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-foreground font-serif text-sm mb-1 line-clamp-1">{tutorial.title}</h3>
                                        {tutorial.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{tutorial.description}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            {search ? (
                                <p className="text-lg">Aucun tutoriel ne correspond à &quot;{search}&quot;</p>
                            ) : (
                                <p className="text-lg">Aucun tutoriel disponible pour le moment.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 border-t border-border mt-auto">
                <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Restaurant OS Inc. Fait avec passion.
                </div>
            </footer>
        </div>
    );
}
