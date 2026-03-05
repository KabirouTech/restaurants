"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Check, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InAppBrowserBanner } from "@/components/auth/InAppBrowserBanner";

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isInApp, setIsInApp] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const t = useTranslations("auth.signup");
    const tAuth = useTranslations("auth");

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
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
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
            provider: "google",
            options: { redirectTo: `${location.origin}/auth/callback` },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    const handleInAppDetected = useCallback((detected: boolean) => {
        setIsInApp(detected);
    }, []);

    const handleResend = async () => {
        setResendCooldown(60);
        await supabase.auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    /* ── Email confirmation screen ─────────────────── */
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white p-8 animate-in fade-in duration-500">
                <div className="max-w-sm w-full text-center space-y-6">
                    {/* Animated mail icon */}
                    <div className="relative mx-auto h-24 w-24">
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-10 w-10 text-primary" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" strokeWidth={3} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold font-serif text-gray-900">{t("confirmEmail.title")}</h1>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t("confirmEmail.subtitle1")}{" "}
                            <strong className="text-gray-800">{email}</strong>.{" "}
                            {t("confirmEmail.subtitle2")}
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-left space-y-2">
                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">{t("confirmEmail.notFound")}</p>
                        <p className="text-xs text-amber-700">{t("confirmEmail.checkSpam")}</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0}
                            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={cn("h-4 w-4", resendCooldown === 0 && "")} />
                            {resendCooldown > 0
                                ? t("confirmEmail.resendIn", { seconds: resendCooldown })
                                : t("confirmEmail.resend")}
                        </button>
                        <Link href="/auth/login">
                            <button className="w-full h-11 rounded-xl text-gray-400 text-sm hover:text-gray-600 transition-colors">
                                {t("confirmEmail.backToLogin")}
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white">

            {/* ── Left Brand Panel ───────────────────────── */}
            <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden bg-gradient-to-br from-[#1a2e1a] via-[#1e3a1e] to-[#2d1a0e]">

                {/* Dot pattern */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                        backgroundSize: "28px 28px",
                    }}
                />

                {/* Glow blobs */}
                <div className="absolute top-[-80px] right-[-80px] w-[380px] h-[380px] rounded-full bg-primary/30 blur-[120px]" />
                <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full bg-amber-600/20 blur-[100px]" />

                {/* Logo */}
                <div className="relative z-10 p-10">
                    <Logo size="md" showText href="/" className="text-white [&_*]:text-white [&_*]:fill-white" />
                </div>

                {/* Center content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-8">
                    <div className="space-y-8 max-w-md">
                        <div className="space-y-3">
                            <p className="text-primary text-sm font-bold uppercase tracking-widest">{t("brandLabel")}</p>
                            <h2 className="text-4xl xl:text-5xl font-bold font-serif text-white leading-tight">
                                {t("brandTitle").split("\n").map((line, i) => (
                                    <span key={i}>{line}{i === 0 && <br />}</span>
                                ))}
                            </h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                {t("brandSubtitle")}
                            </p>
                        </div>

                        {/* Perks */}
                        <div className="space-y-3">
                            {(t.raw("perks") as string[]).map((perk: string) => (
                                <div key={perk} className="flex items-center gap-3">
                                    <div className="h-5 w-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                                    </div>
                                    <span className="text-white/75 text-sm">{perk}</span>
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            {[
                                { value: "10+", label: "modules" },
                                { value: "5 min", label: "installation" },
                                { value: "0 FCFA", label: "pour démarrer" },
                            ].map(({ value, label }) => (
                                <div key={label} className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-xl font-bold text-white font-serif">{value}</p>
                                    <p className="text-white/50 text-xs mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Testimonial */}
                <div className="relative z-10 mx-10 mb-10 p-5 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10">
                    <p className="text-white/80 text-sm italic font-serif leading-relaxed">
                        &quot;La cuisine, c&apos;est de l&apos;art. L&apos;organisation, c&apos;est RestaurantsOS.&quot;
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-500/40 flex items-center justify-center text-white font-bold text-xs">C</div>
                        <div>
                            <p className="text-white text-xs font-semibold">Cheikh N.</p>
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
                            {t("alreadyAccount")}{" "}
                            <Link href="/auth/login" className="text-gray-900 font-semibold hover:text-primary transition-colors">
                                {t("login")}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-12 xl:px-20 pb-12 max-w-md mx-auto w-full lg:max-w-none lg:mx-0">
                    <div className="max-w-sm mx-auto w-full space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Header */}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight font-serif text-gray-900">
                                {t("title")}
                            </h1>
                            <p className="text-gray-400">
                                {t("subtitle")}
                            </p>
                        </div>

                        {/* In-app browser banner */}
                        <InAppBrowserBanner
                            onInAppDetected={handleInAppDetected}
                            namespace="auth.signup"
                            t={t}
                        />

                        {/* Google - hidden in in-app browsers */}
                        {!isInApp && (
                            <>
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
                            </>
                        )}

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
                                <label className="text-sm font-semibold text-gray-700">{t("password")}</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={8}
                                        autoComplete="new-password"
                                        placeholder={t("passwordPlaceholder")}
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

                        {/* Legal */}
                        <p className="text-center text-xs text-gray-300 leading-relaxed">
                            {t("terms")}{" "}
                            <Link href="#" className="text-gray-400 hover:text-gray-600 underline underline-offset-2">{t("termsLink")}</Link>{" "}
                            {t("privacyAnd")}{" "}
                            <Link href="#" className="text-gray-400 hover:text-gray-600 underline underline-offset-2">{t("privacyLink")}</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
