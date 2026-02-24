"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getBarStyle, getAnimationClass, getFormatClasses } from "@/lib/announcement-styles";

interface Announcement {
    id: string;
    message: string;
    type: string;
    dismissible: boolean;
    link_url?: string | null;
    link_label?: string | null;
    emoji?: string | null;
    animation?: string | null;
    position?: string | null;
    display_format?: string | null;
}

type PositionKey = "top" | "bottom" | "floating-br" | "floating-bl" | "popup";

function AnnouncementItem({
    ann,
    onDismiss,
    isFloating,
}: {
    ann: Announcement;
    onDismiss: (id: string) => void;
    isFloating?: boolean;
}) {
    const format = ann.display_format || "bar";
    const position = ann.position || "top";

    // In floating position, bar format forces card-like style
    const formatClasses = isFloating && format === "bar"
        ? "rounded-xl shadow-lg"
        : getFormatClasses(format);

    return (
        <div
            className={`${getBarStyle(ann.type)} ${formatClasses} ${getAnimationClass(ann.animation, position)} px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-3 overflow-hidden`}
        >
            {ann.emoji && <span className="text-lg shrink-0">{ann.emoji}</span>}
            <span className="text-center flex-1">{ann.message}</span>
            {ann.link_url && (
                ann.link_url.startsWith("http") ? (
                    <a
                        href={ann.link_url}
                        className="shrink-0 underline underline-offset-2 text-xs font-semibold flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {ann.link_label || "En savoir plus"} <ExternalLink className="h-3 w-3" />
                    </a>
                ) : (
                    <Link
                        href={ann.link_url}
                        className="shrink-0 underline underline-offset-2 text-xs font-semibold flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
                    >
                        {ann.link_label || "En savoir plus"} <ExternalLink className="h-3 w-3" />
                    </Link>
                )
            )}
            {ann.dismissible && (
                <button
                    onClick={() => onDismiss(ann.id)}
                    className="shrink-0 hover:opacity-70 transition-opacity"
                    aria-label="Fermer"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

export function AnnouncementBar({ announcements }: { announcements: Announcement[] }) {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        try {
            const stored = localStorage.getItem("dismissed_announcements");
            if (stored) {
                setDismissed(new Set(JSON.parse(stored)));
            }
        } catch { }
    }, []);

    const handleDismiss = (id: string) => {
        const next = new Set(dismissed);
        next.add(id);
        setDismissed(next);
        try {
            localStorage.setItem("dismissed_announcements", JSON.stringify([...next]));
        } catch { }
    };

    const visible = announcements.filter(a => !dismissed.has(a.id));

    // Group by effective position (popups always go to their own group)
    const grouped = useMemo(() => {
        const groups: Record<PositionKey, Announcement[]> = {
            top: [],
            bottom: [],
            "floating-br": [],
            "floating-bl": [],
            popup: [],
        };
        for (const ann of visible) {
            const format = ann.display_format || "bar";
            if (format === "popup") {
                groups.popup.push(ann);
            } else {
                const pos = (ann.position || "top") as PositionKey;
                if (groups[pos]) {
                    groups[pos].push(ann);
                } else {
                    groups.top.push(ann);
                }
            }
        }
        return groups;
    }, [visible]);

    if (visible.length === 0) return null;

    return (
        <>
            {/* Top — in the normal flow */}
            {grouped.top.length > 0 && (
                <div className="shrink-0 print:hidden">
                    {grouped.top.map((ann) => (
                        <AnnouncementItem key={ann.id} ann={ann} onDismiss={handleDismiss} />
                    ))}
                </div>
            )}

            {/* Bottom — fixed */}
            {grouped.bottom.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 print:hidden">
                    {grouped.bottom.map((ann) => (
                        <AnnouncementItem key={ann.id} ann={ann} onDismiss={handleDismiss} />
                    ))}
                </div>
            )}

            {/* Floating bottom-right */}
            {grouped["floating-br"].length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 max-w-sm space-y-2 print:hidden">
                    {grouped["floating-br"].map((ann) => (
                        <AnnouncementItem key={ann.id} ann={ann} onDismiss={handleDismiss} isFloating />
                    ))}
                </div>
            )}

            {/* Floating bottom-left */}
            {grouped["floating-bl"].length > 0 && (
                <div className="fixed bottom-4 left-4 z-50 max-w-sm space-y-2 print:hidden">
                    {grouped["floating-bl"].map((ann) => (
                        <AnnouncementItem key={ann.id} ann={ann} onDismiss={handleDismiss} isFloating />
                    ))}
                </div>
            )}

            {/* Popup — modal overlay */}
            {grouped.popup.length > 0 && (
                <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center print:hidden">
                    <div className="space-y-3 max-w-lg w-full mx-4">
                        {grouped.popup.map((ann) => (
                            <AnnouncementItem key={ann.id} ann={ann} onDismiss={handleDismiss} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
