"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// ─── Curated palette ──────────────────────────────────────────────────────────

const PALETTE = [
    // Grays
    "#F8FAFC", "#E2E8F0", "#94A3B8", "#64748B", "#334155",
    // Reds
    "#FEE2E2", "#FCA5A5", "#F87171", "#EF4444", "#B91C1C",
    // Oranges
    "#FFEDD5", "#FDC4A3", "#FB923C", "#F97316", "#C2410C",
    // Yellows
    "#FEF9C3", "#FDE047", "#FACC15", "#EAB308", "#A16207",
    // Greens
    "#DCFCE7", "#86EFAC", "#4ADE80", "#22C55E", "#15803D",
    // Teals
    "#CCFBF1", "#5EEAD4", "#2DD4BF", "#14B8A6", "#0F766E",
    // Blues
    "#DBEAFE", "#93C5FD", "#60A5FA", "#3B82F6", "#1D4ED8",
    // Indigos
    "#E0E7FF", "#A5B4FC", "#818CF8", "#6366F1", "#4338CA",
    // Purples
    "#F3E8FF", "#D8B4FE", "#C084FC", "#A855F7", "#7E22CE",
    // Pinks
    "#FCE7F3", "#F9A8D4", "#F472B6", "#EC4899", "#BE185D",
];

// ─── Component ────────────────────────────────────────────────────────────────

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
    const [open, setOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value);
    const ref = useRef<HTMLDivElement>(null);

    // Sync hex input when value changes from outside
    useEffect(() => setHexInput(value), [value]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const handlePaletteClick = (color: string) => {
        onChange(color);
        setHexInput(color);
    };

    const handleHexChange = (raw: string) => {
        setHexInput(raw);
        // Accept as soon as it's a valid 6-digit hex
        if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
            onChange(raw);
        }
    };

    const handleHexBlur = () => {
        // Revert if invalid
        if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
            setHexInput(value);
        }
    };

    return (
        <div className="relative" ref={ref}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 h-8 px-2.5 rounded-md border border-border bg-white hover:bg-muted/30 transition-colors"
            >
                <span
                    className="h-4 w-4 rounded-sm border border-black/10 shrink-0 shadow-inner"
                    style={{ backgroundColor: value }}
                />
                <span className="text-xs font-mono text-muted-foreground">{value.toUpperCase()}</span>
            </button>

            {/* Popover */}
            {open && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-[228px] rounded-xl border border-border bg-white shadow-xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">

                    {/* Palette grid - 5 cols × 10 rows */}
                    <div className="grid grid-cols-10 gap-1 mb-3">
                        {PALETTE.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => handlePaletteClick(color)}
                                className={cn(
                                    "h-5 w-5 rounded-sm border border-black/10 transition-transform hover:scale-110 hover:shadow-md flex items-center justify-center",
                                )}
                                style={{ backgroundColor: color }}
                                title={color}
                            >
                                {value.toLowerCase() === color.toLowerCase() && (
                                    <Check
                                        className="h-3 w-3 drop-shadow"
                                        style={{ color: isLight(color) ? "#374151" : "#ffffff" }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Hex input */}
                    <div className="flex items-center gap-2 mt-1">
                        <span
                            className="h-7 w-7 rounded-md border border-border shrink-0 shadow-inner"
                            style={{ backgroundColor: value }}
                        />
                        <div className="flex items-center flex-1 border border-border rounded-md overflow-hidden bg-muted/20">
                            <span className="px-2 text-xs text-muted-foreground font-mono select-none">#</span>
                            <input
                                type="text"
                                value={hexInput.replace(/^#/, "")}
                                onChange={(e) => handleHexChange("#" + e.target.value)}
                                onBlur={handleHexBlur}
                                maxLength={6}
                                className="flex-1 bg-transparent text-xs font-mono py-1 pr-2 outline-none text-foreground"
                                placeholder="6B7280"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper: is the color light? (for checkmark contrast)
function isLight(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}
