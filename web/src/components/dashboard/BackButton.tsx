"use client";

import { Button } from "@/components/ui/button";

export function BackButton() {
    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
        >
            Annuler
        </Button>
    );
}
