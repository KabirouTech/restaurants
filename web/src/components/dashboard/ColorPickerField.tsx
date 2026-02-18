"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ColorPickerField({ defaultValue }: { defaultValue: string }) {
    const [color, setColor] = useState(defaultValue);

    return (
        <div className="flex gap-4 items-center">
            <Input
                type="color"
                name="primaryColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer shrink-0"
            />
            <div className="space-y-1 flex-1">
                <Input
                    // Don't give this a name so it doesn't clutter form data, or give it a different one
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#f4af25"
                    className="font-mono uppercase"
                    maxLength={7}
                />
                <p className="text-xs text-muted-foreground">Sélectionnez la couleur dominante de votre site.</p>
            </div>
        </div>
    );
}
