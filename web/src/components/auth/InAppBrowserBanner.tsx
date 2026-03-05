"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

function isInAppBrowser(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    return /FBAN|FBAV|Instagram|Line\/|Snapchat|Twitter|TikTok|LinkedIn|KAKAOTALK|; wv\)/i.test(ua);
}

interface InAppBrowserBannerProps {
    onInAppDetected?: (isInApp: boolean) => void;
    namespace: "auth.login" | "auth.signup";
    t: (key: string) => string;
}

export function InAppBrowserBanner({ onInAppDetected, namespace, t }: InAppBrowserBannerProps) {
    const [isInApp, setIsInApp] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const detected = isInAppBrowser();
        setIsInApp(detected);
        onInAppDetected?.(detected);
    }, [onInAppDetected]);

    if (!isInApp) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast.success(t("linkCopied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement("textarea");
            textarea.value = window.location.href;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            toast.success(t("linkCopied"));
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="w-full p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium leading-snug">
                    {t("inAppBanner")}
                </p>
            </div>
            <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold transition-colors"
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("linkCopied") : t("openInBrowser")}
            </button>
            {namespace === "auth.login" && (
                <p className="text-xs text-amber-600 text-center">
                    {t("orUseMagicLink")}
                </p>
            )}
        </div>
    );
}
