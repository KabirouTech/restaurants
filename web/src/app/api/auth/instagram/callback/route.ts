import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const orgId = request.nextUrl.searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !orgId) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?error=missing_params`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/auth/instagram/callback`;

    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/settings?error=token_exchange`
      );
    }

    // Exchange for long-lived token
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();
    const accessToken = longLivedData.access_token || tokenData.access_token;

    // Get Instagram business account from connected pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    const page = pagesData.data?.find(
      (p: any) => p.instagram_business_account
    );
    if (!page) {
      return NextResponse.redirect(
        `${appUrl}/dashboard/settings?error=no_instagram_account`
      );
    }

    const igAccount = page.instagram_business_account;

    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Upsert channel
    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .eq("organization_id", orgId)
      .eq("platform", "instagram")
      .maybeSingle();

    const credentials = {
      page_id: page.id,
      access_token: accessToken,
      ig_username: igAccount.username,
    };

    if (existing) {
      await supabase
        .from("channels")
        .update({
          provider_id: igAccount.id,
          credentials,
          is_active: true,
          name: `Instagram @${igAccount.username}`,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("channels").insert({
        organization_id: orgId,
        platform: "instagram",
        name: `Instagram @${igAccount.username}`,
        provider_id: igAccount.id,
        credentials,
        is_active: true,
      });
    }

    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?tab=channels&success=instagram`
    );
  } catch (err: any) {
    console.error("Instagram OAuth error:", err);
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?error=oauth_failed`
    );
  }
}
