"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, CalendarDays, MessageSquare, BookOpen, Package } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const t = useTranslations("auth.login");
    const tAuth = useTranslations("auth");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
            setError(t("error"));
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${location.origin}/auth/callback` },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    return (
        <div className="min-h-screen flex bg-white">

            {/* ── Left Brand Panel ───────────────────────── */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden bg-gradient-to-br from-[#1a2e1a] via-[#1e3a1e] to-[#2d1a0e]">

                {/* Dot pattern overlay */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                        backgroundSize: "28px 28px",
                    }}
                />

                {/* Glow blobs */}
                <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-primary/30 blur-[120px]" />
                <div className="absolute bottom-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full bg-amber-600/20 blur-[100px]" />

                {/* Logo */}
                <div className="relative z-10 p-10">
                    <Logo size="md" showText href="/" className="text-white [&_*]:text-white [&_*]:fill-white" />
                </div>

                {/* Center content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-8">
                    <div className="space-y-6 max-w-md">
                        <div className="space-y-3">
                            <p className="text-primary text-sm font-bold uppercase tracking-widest">{t("welcomeLabel")}</p>
                            <h2 className="text-4xl xl:text-5xl font-bold font-serif text-white leading-tight">
                                {t("welcomeTitle").split("\n").map((line, i) => (
                                    <span key={i}>{line}{i === 0 && <br />}</span>
                                ))}
                            </h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                {t("welcomeSubtitle")}
                            </p>
                        </div>

                        {/* Feature pills */}
                        <div className="flex flex-col gap-3 pt-4">
                            {[
                                { icon: <CalendarDays className="h-4 w-4" />, label: "Calendrier & Capacité" },
                                { icon: <MessageSquare className="h-4 w-4" />, label: "Messagerie Unifiée" },
                                { icon: <BookOpen className="h-4 w-4" />, label: "Recettes & Inventaire" },
                                { icon: <Package className="h-4 w-4" />, label: "Devis & Commandes" },
                            ].map(({ icon, label }) => (
                                <div key={label} className="flex items-center gap-3 text-white/70 text-sm">
                                    <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-primary">
                                        {icon}
                                    </div>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Testimonial */}
                <div className="relative z-10 mx-10 mb-10 p-5 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10">
                    <p className="text-white/80 text-sm italic font-serif leading-relaxed">
                        &quot;Avant RestaurantsOS, je jonglais entre 4 applis différentes. Maintenant tout est là.&quot;
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/40 flex items-center justify-center text-white font-bold text-xs">A</div>
                        <div>
                            <p className="text-white text-xs font-semibold">Aminata D.</p>
                            <p className="text-white/50 text-xs">Traiteur · Dakar</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Form Panel ───────────────────────── */}
            <div className="flex-1 flex flex-col">

                {/* Top bar */}
                <div className="flex items-center justify-between px-8 py-6">
                    <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium">
                        <ArrowLeft className="h-4 w-4" /> {tAuth("back")}
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors" />
                        <p className="text-sm text-gray-400">
                            {t("noAccount")}{" "}
                            <Link href="/auth/signup" className="text-gray-900 font-semibold hover:text-primary transition-colors">
                                {t("signup")}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-12 xl:px-20 pb-12 max-w-md mx-auto w-full lg:max-w-none lg:mx-0">
                    <div className="max-w-sm mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Header */}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight font-serif text-gray-900">
                                {t("title")}
                            </h1>
                            <p className="text-gray-400">
                                {t("subtitle")}
                            </p>
                        </div>

                        {/* Google */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-[0.99] disabled:opacity-50"
                        >
                            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 488 512">
                                <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                            </svg>
                            {t("google")}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-gray-100" />
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">ou</span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">{t("email")}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="chef@restaurant.com"
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-300 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">{t("password")}</label>
                                    <Link href="#" className="text-xs text-gray-400 hover:text-primary transition-colors">
                                        {t("forgotPassword")}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="w-full h-12 pl-10 pr-11 rounded-xl border-2 border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-300 focus:outline-none focus:border-primary transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full h-12 rounded-xl font-bold text-white text-sm transition-all",
                                    "bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90",
                                    "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                                    "active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                                )}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                        </svg>
                                        {t("loading")}
                                    </span>
                                ) : t("submit")}
                            </button>
                        </form>

                        {/* Footer note */}
                        <p className="text-center text-xs text-gray-300">
                            {t("terms")}{" "}
                            <Link href="#" className="text-gray-400 hover:text-gray-600 underline underline-offset-2">{t("termsLink")}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
