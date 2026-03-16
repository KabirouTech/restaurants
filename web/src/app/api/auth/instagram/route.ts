import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const appId = process.env.META_APP_ID?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
  const redirectUri = `${appUrl}/api/auth/instagram/callback`;

  const orgId = request.nextUrl.searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  }

  if (!appId) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?tab=channels&error=missing_meta_config`
    );
  }

  const scope = "instagram_manage_messages,pages_manage_metadata";
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${orgId}&response_type=code`;

  return NextResponse.redirect(authUrl);
}
