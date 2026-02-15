"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, AlertCircle, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const emailVal = formData.get("email") as string;
        const password = formData.get("password") as string;
        setEmail(emailVal);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: emailVal,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            if (data.session) {
                router.push("/dashboard?onboarding=true");
            } else {
                setSuccess(true);
                setLoading(false);
            }
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

    const handleResend = async () => {
        setResendCooldown(60);
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            }
        });
        if (error) setError("Erreur d'envoi: " + error.message);

        // Countdown
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) clearInterval(interval);
                return prev - 1;
            });
        }, 1000);
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground p-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
                        <Mail className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-secondary">Vérifiez vos emails !</h1>
                    <p className="text-muted-foreground text-lg">
                        Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte.
                    </p>

                    <div className="space-y-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={handleResend}
                            disabled={resendCooldown > 0}
                            className="w-full gap-2"
                        >
                            {resendCooldown > 0 ? (
                                `Ruvoyer dans ${resendCooldown}s`
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4" /> Renvoyer l'email
                                </>
                            )}
                        </Button>
                        <Link href="/auth/login" className="block w-full">
                            <Button variant="ghost" className="w-full">Retour à la connexion</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
            {/* Visual Side */}
            <div className="hidden lg:block relative bg-primary/5 border-r border-border overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-multiply"></div>
                <div className="absolute bottom-10 left-10 p-8 max-w-md z-10 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white">
                    <blockquote className="text-xl font-medium font-serif italic mb-4">
                        "La cuisine, c'est de l'art. L'organisation, c'est Restaurant OS."
                    </blockquote>
                    <cite className="not-italic text-sm text-gray-300 font-medium">— Cheikh N., Traiteur à Dakar</cite>
                </div>
            </div>

            {/* Form Side */}
            <div className="flex flex-col justify-center items-center p-8 lg:p-16 relative">
                <Link href="/" className="absolute top-8 left-8 text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors font-medium">
                    <ArrowLeft className="h-4 w-4" /> Retour au site
                </Link>

                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight font-serif text-secondary">Rejoignez la Tribu</h1>
                        <p className="text-muted-foreground">Créez votre compte pour commencer.</p>
                    </div>

                    <div className="space-y-4">
                        <Button variant="outline" type="button" onClick={handleGoogleLogin} className="w-full h-12 gap-2 text-foreground font-medium" disabled={loading}>
                            <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            S'inscrire avec Google
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
                            <label htmlFor="email" className="text-sm font-medium leading-none">Email professionnel</label>
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
                            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-white font-medium shadow-md transition-all active:scale-[0.98]" disabled={loading}>
                            {loading ? "Création du compte..." : "S'inscrire"}
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Déjà un compte ?{" "}
                        <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary font-medium text-foreground">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
