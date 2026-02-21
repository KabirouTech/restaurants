"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Announcement {
    id: string;
    message: string;
    type: string;
    dismissible: boolean;
}

const typeStyles: Record<string, string> = {
    info: "bg-blue-500 text-white",
    warning: "bg-amber-500 text-white",
    success: "bg-green-500 text-white",
};

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
    if (visible.length === 0) return null;

    return (
        <div className="shrink-0 print:hidden">
            {visible.map((ann) => {
                const style = typeStyles[ann.type] || typeStyles.info;
                return (
                    <div key={ann.id} className={`${style} px-4 py-2 text-sm font-medium flex items-center justify-center gap-3`}>
                        <span className="text-center flex-1">{ann.message}</span>
                        {ann.dismissible && (
                            <button
                                onClick={() => handleDismiss(ann.id)}
                                className="shrink-0 hover:opacity-70 transition-opacity"
                                aria-label="Fermer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
