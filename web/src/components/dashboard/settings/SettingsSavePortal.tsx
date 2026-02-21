"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function SettingsSavePortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const el = document.getElementById("settings-save-portal");
    if (!el) return null;

    return createPortal(children, el);
}
