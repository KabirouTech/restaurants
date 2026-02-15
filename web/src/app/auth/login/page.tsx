"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            }
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
            {/* Visual Side - Teranga Welcome */}
            <div className="hidden lg:block relative bg-secondary/90 border-r border-border overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547496502-84383a5d052c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white p-8 w-full max-w-lg">
                    <h2 className="text-4xl font-bold font-serif mb-4">Content de vous revoir.</h2>
                    <p className="text-lg opacity-80">Votre cuisine vous attend.</p>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative">
                <Link href="/" className="absolute top-8 left-8 text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors font-medium">
                    <ArrowLeft className="h-4 w-4" /> Retour au site
                </Link>

                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight font-serif text-secondary">Connexion</h1>
                        <p className="text-muted-foreground">Entrez vos identifiants pour accéder au dashboard.</p>
                    </div>

                    <div className="space-y-4">
                        <Button variant="outline" type="button" onClick={handleGoogleLogin} className="w-full h-12 gap-2 text-foreground font-medium" disabled={loading}>
                            <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Continuer avec Google
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Ou avec email</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="chef@restaurant.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium leading-none">Mot de passe</label>
                                <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Mot de passe oublié ?</Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
                                {error}
                            </div>
                        )}

                        <Button className="w-full h-12 text-lg bg-secondary hover:bg-secondary/90 text-white font-medium shadow-md transition-all active:scale-[0.98]" disabled={loading}>
                            {loading ? "Connexion..." : "Se connecter"}
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Pas encore de compte ?{" "}
                        <Link href="/auth/signup" className="underline underline-offset-4 hover:text-primary font-medium text-foreground">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
