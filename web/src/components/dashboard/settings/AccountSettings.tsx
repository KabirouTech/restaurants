"use client";

import { UserProfile } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AccountSettings() {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-base">Mon Compte</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <UserProfile
                    routing="hash"
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "w-full shadow-none border-0 rounded-none",
                            navbar: "hidden",
                            pageScrollBox: "p-4 md:p-6",
                        },
                    }}
                />
            </CardContent>
        </Card>
    );
}
