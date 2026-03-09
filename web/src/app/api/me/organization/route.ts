import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export async function GET() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) {
        return NextResponse.json({ organizationId: null }, { status: 401 });
    }

    return NextResponse.json({
        organizationId: profile?.organization_id ?? null,
    });
}
