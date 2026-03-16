"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { sendMail } from "@/lib/mailer";

async function findSupabaseAuthUserIdByEmail(
    adminClient: SupabaseClient,
    email: string
) {
    const normalized = email.trim().toLowerCase();
    const { data: authUsersData, error: listUsersError } = await adminClient.auth.admin.listUsers();
    if (listUsersError) {
        console.warn("[onboarding] Unable to list Supabase auth users:", listUsersError.message);
        return null;
    }

    return (
        authUsersData.users.find((u) => u.email?.toLowerCase() === normalized)?.id ?? null
    );
}

async function createOrLinkProfileForClerk(
    adminClient: SupabaseClient,
    userId: string,
    orgId: string,
    fullName: string
) {
    const baseProfilePayload = {
        clerk_id: userId,
        organization_id: orgId,
        full_name: fullName,
        role: "admin",
    };

    // Preferred path when profiles.clerk_id has a plain UNIQUE constraint.
    const { error: upsertError } = await adminClient
        .from("profiles")
        .upsert(baseProfilePayload, { onConflict: "clerk_id" });

    if (!upsertError) return null;

    // 42P10 means ON CONFLICT could not find a matching unique/exclusion constraint.
    // Some environments still have a partial index on clerk_id; use a manual fallback.
    if (upsertError.code !== "42P10") {
        return upsertError.message;
    }

    const { data: existingProfile, error: existingProfileError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("clerk_id", userId)
        .limit(1)
        .maybeSingle();

    if (existingProfileError) {
        return existingProfileError.message;
    }

    if (existingProfile?.id) {
        const { error: updateError } = await adminClient
            .from("profiles")
            .update({
                organization_id: orgId,
                full_name: fullName,
                role: "admin",
            })
            .eq("id", existingProfile.id);

        return updateError?.message ?? null;
    }

    // Try direct insert (works if profiles.id has a DB default and no auth.users FK dependency).
    const { error: directInsertError } = await adminClient
        .from("profiles")
        .insert(baseProfilePayload);

    if (!directInsertError) return null;

    // Legacy schema fallback: profiles.id requires a Supabase auth.users UUID.
    if (directInsertError.code !== "23502" && directInsertError.code !== "23503") {
        return directInsertError.message;
    }

    const clerk = await currentUser();
    const email =
        clerk?.primaryEmailAddress?.emailAddress ?? clerk?.emailAddresses?.[0]?.emailAddress ?? null;

    if (!email) {
        return "Le profil n'a pas pu être créé (email utilisateur introuvable). Vérifiez la migration Clerk.";
    }

    let authUserId = await findSupabaseAuthUserIdByEmail(adminClient, email);

    if (!authUserId) {
        const { data: createdAuthUser, error: createAuthUserError } =
            await adminClient.auth.admin.createUser({
                email,
                email_confirm: true,
                password: `${randomUUID()}Aa1!`,
                user_metadata: {
                    source: "clerk_onboarding_bridge",
                },
            });

        if (createAuthUserError) {
            // If user already exists but wasn't in the first list page, retry lookup.
            authUserId = await findSupabaseAuthUserIdByEmail(adminClient, email);
            if (!authUserId) {
                return createAuthUserError.message;
            }
        } else {
            authUserId = createdAuthUser.user?.id ?? null;
        }
    }

    if (!authUserId) {
        return "Impossible de créer/lier un utilisateur Supabase Auth pour finaliser le profil.";
    }

    const { error: insertWithIdError } = await adminClient
        .from("profiles")
        .insert({
            id: authUserId,
            ...baseProfilePayload,
        });

    if (!insertWithIdError) return null;

    if (insertWithIdError.code === "23505") {
        const { error: raceUpdateError } = await adminClient
            .from("profiles")
            .update({
                organization_id: orgId,
                full_name: fullName,
                role: "admin",
            })
            .eq("clerk_id", userId);

        return raceUpdateError?.message ?? null;
    }

    return insertWithIdError.message;
}

type OnboardingService = {
    name: string;
    loadCost: string | number;
    color?: string;
};

type OnboardingMenuItem = {
    name: string;
    description?: string;
    price?: string | number;
    category?: string;
    imageUrl?: string;
};

const DEFAULT_ONBOARDING_SERVICES: OnboardingService[] = [
    { name: "Mariage", loadCost: 50, color: "#10b981" },
    { name: "Cocktail Dînatoire", loadCost: 10, color: "#f59e0b" },
];

const DEFAULT_ONBOARDING_MENU_ITEMS: OnboardingMenuItem[] = [
    {
        name: "Thiéboudienne Royal",
        description: "Poisson frais, riz brisé, légumes du marché",
        price: "15",
        category: "Plat",
    },
];

function parseJsonArray<T>(raw: FormDataEntryValue | null): T[] {
    if (!raw || typeof raw !== "string") return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
}

function normalizeServices(rawServices: OnboardingService[]) {
    return rawServices
        .map((service) => {
            const name = String(service.name ?? "").trim();
            const parsedLoadCost = parseInt(String(service.loadCost), 10);
            const load_cost = Number.isFinite(parsedLoadCost) && parsedLoadCost > 0 ? parsedLoadCost : 10;
            const color_code = service.color ? String(service.color) : "#6b7280";
            return { name, load_cost, color_code };
        })
        .filter((service) => service.name.length > 0);
}

function normalizeMenuItems(rawItems: OnboardingMenuItem[]) {
    return rawItems
        .map((item) => {
            const name = String(item.name ?? "").trim();
            const price_cents = Math.round(parseFloat(String(item.price ?? "0")) * 100);
            return {
                name,
                description: item.description ? String(item.description) : null,
                price_cents: Number.isFinite(price_cents) && price_cents > 0 ? price_cents : 0,
                category: item.category ? String(item.category) : "Plat",
                image_url: item.imageUrl ? String(item.imageUrl) : null,
            };
        })
        .filter((item) => item.name.length > 0 && item.price_cents > 0);
}

export async function createOrganizationAction(formData: FormData) {
    // 1. Verify User Authentication (Clerk)
    const { userId } = await auth();

    if (!userId) {
        return { error: "Non authentifié" };
    }

    // 2. Initialize Admin Client (Bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const name = formData.get("orgName") as string;
    const description = formData.get("orgDescription") as string;
    const fullName = formData.get("fullName") as string;
    const currency = (formData.get("currency") as string) || "XOF";
    const primaryColor = (formData.get("primaryColor") as string) || "#f4af25";
    const servicesSkipped = formData.get("servicesSkipped") === "true";
    const menuSkipped = formData.get("menuSkipped") === "true";

    // Create slug from name, only add suffix if already taken
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: slugCheck } = await adminClient
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
    if (slugCheck) {
        slug = slug + "-" + Math.random().toString(36).substring(2, 5);
    }

    // 3. Create Organization (Admin)
    const { data: org, error: orgError } = await adminClient
        .from("organizations")
        .insert({
            name,
            slug,
            subscription_plan: "free",
            settings: { description, currency, primary_color: primaryColor },
        })
        .select()
        .single();

    if (orgError) {
        console.error("Org Error:", orgError);
        return { error: "Erreur lors de la création de l'organisation: " + orgError.message };
    }

    // 4. Create/Link User Profile (Admin)
    const profileError = await createOrLinkProfileForClerk(
        adminClient,
        userId,
        org.id,
        fullName
    );

    if (profileError) {
        console.error("Profile Error:", profileError);
        return { error: "Erreur lors de la création du profil: " + profileError };
    }

    // 5. Add Services (Capacity Types)
    const rawServices = parseJsonArray<OnboardingService>(formData.get("services"));
    const normalizedServices = normalizeServices(rawServices);
    const servicesToInsert = normalizedServices.length
        ? normalizedServices
        : normalizeServices(DEFAULT_ONBOARDING_SERVICES);

    if (!servicesSkipped || servicesToInsert.length > 0) {
        const { error: serviceError } = await adminClient
            .from("capacity_types")
            .insert(
                servicesToInsert.map((service) => ({
                    organization_id: org.id,
                    ...service,
                }))
            );

        if (serviceError) {
            console.error("Service Error:", serviceError);
            return { error: "Erreur lors de la création des types d'événements: " + serviceError.message };
        }
    }

    // 6. Add Menu Items (Products)
    // If user skipped this step, we still create a default starter item.
    const rawMenuItems = parseJsonArray<OnboardingMenuItem>(formData.get("menuItems"));
    const normalizedMenuItems = normalizeMenuItems(rawMenuItems);
    const menuItemsToInsert = normalizedMenuItems.length
        ? normalizedMenuItems
        : normalizeMenuItems(DEFAULT_ONBOARDING_MENU_ITEMS);

    if (!menuSkipped || menuItemsToInsert.length > 0) {
        const { error: productError } = await adminClient
            .from("products")
            .insert(
                menuItemsToInsert.map((item) => ({
                    organization_id: org.id,
                    ...item,
                }))
            );

        if (productError) {
            console.error("Product Error:", productError);
            return { error: "Erreur lors de la création des plats initiaux: " + productError.message };
        }
    }

    // 7. Set Default Calendar (Mon-Sat Open)
    const defaultCalendar = [1, 2, 3, 4, 5, 6].map(day => ({
        organization_id: org.id,
        day_of_week: day,
        max_daily_load: 100, // Default base capacity unit
        is_open: true
    }));
    await adminClient.from("defaults_calendar").insert(defaultCalendar);

    // 8. Send Welcome Email (non-blocking)
    try {
        const clerk = await currentUser();
        const email =
            clerk?.primaryEmailAddress?.emailAddress ?? clerk?.emailAddresses?.[0]?.emailAddress;
        if (email) {
            await sendWelcomeEmail({ email, fullName, orgName: name });
        }
    } catch (err) {
        console.warn("[onboarding] Welcome email failed (non-blocking):", err);
    }

    revalidatePath("/", "layout");
    return { success: true, orgId: org.id };
}

// ─────────────────────────────────────────────────────────────
// Welcome Email
// ─────────────────────────────────────────────────────────────

async function sendWelcomeEmail({
    email,
    fullName,
    orgName,
}: {
    email: string;
    fullName: string;
    orgName: string;
}) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
        || (process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : "http://localhost:3000");

    const dashboardUrl = `${appUrl}/dashboard`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur RestaurantOS</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">

    <!-- Hero header -->
    <div style="background:linear-gradient(135deg,#d97706 0%,#ea580c 50%,#dc2626 100%);padding:56px 40px 48px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:16px;padding:16px 20px;margin-bottom:24px;">
        <span style="font-size:40px;line-height:1;">&#127860;</span>
      </div>
      <h1 style="color:#ffffff;margin:0 0 8px;font-size:28px;font-weight:800;letter-spacing:-0.03em;">
        Bienvenue sur RestaurantOS !
      </h1>
      <p style="color:rgba(255,255,255,0.9);margin:0;font-size:16px;font-weight:400;">
        Votre espace est prêt. Commencez dès maintenant.
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">

      <p style="color:#1f2937;font-size:17px;line-height:1.6;margin:0 0 8px;">
        Bonjour <strong>${fullName}</strong>,
      </p>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 32px;">
        Félicitations ! Votre organisation <strong style="color:#d97706;">${orgName}</strong> a été créée avec succès.
        Tout est en place pour simplifier la gestion de votre activité.
      </p>

      <!-- Features grid -->
      <div style="margin-bottom:36px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="width:50%;vertical-align:top;padding:0 8px 16px 0;">
              <div style="background:#fffbeb;border-radius:12px;padding:20px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">&#128203;</div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#92400e;">Commandes</p>
                <p style="margin:4px 0 0;font-size:12px;color:#a16207;">Gérez vos commandes en un clic</p>
              </div>
            </td>
            <td style="width:50%;vertical-align:top;padding:0 0 16px 8px;">
              <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">&#127869;</div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#166534;">Menu</p>
                <p style="margin:4px 0 0;font-size:12px;color:#15803d;">Votre carte en ligne</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="width:50%;vertical-align:top;padding:0 8px 0 0;">
              <div style="background:#eff6ff;border-radius:12px;padding:20px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">&#128172;</div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#1e40af;">Messagerie</p>
                <p style="margin:4px 0 0;font-size:12px;color:#2563eb;">WhatsApp, email, Instagram</p>
              </div>
            </td>
            <td style="width:50%;vertical-align:top;padding:0 0 0 8px;">
              <div style="background:#fdf2f8;border-radius:12px;padding:20px;text-align:center;">
                <div style="font-size:28px;margin-bottom:8px;">&#128101;</div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#9d174d;">Clients</p>
                <p style="margin:4px 0 0;font-size:12px;color:#be185d;">CRM intégré</p>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:36px;">
        <a href="${dashboardUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#d97706 0%,#ea580c 100%);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 52px;border-radius:12px;box-shadow:0 4px 14px rgba(217,119,6,0.4);letter-spacing:0.01em;">
          Accéder à mon tableau de bord
        </a>
      </div>

      <!-- Tips section -->
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:24px;margin-bottom:28px;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:700;color:#1f2937;">
          &#128161; Prochaines étapes recommandées
        </p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">
              <span style="display:inline-block;width:24px;height:24px;background:#d97706;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">1</span>
              Complétez votre menu avec vos plats et prix
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">
              <span style="display:inline-block;width:24px;height:24px;background:#ea580c;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">2</span>
              Personnalisez votre vitrine en ligne
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">
              <span style="display:inline-block;width:24px;height:24px;background:#dc2626;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;margin-right:10px;">3</span>
              Invitez votre équipe à rejoindre l'espace
            </td>
          </tr>
        </table>
      </div>

      <!-- Divider -->
      <div style="border-top:1px solid #e5e7eb;margin:0 0 24px;"></div>

      <p style="color:#6b7280;font-size:13px;text-align:center;line-height:1.6;margin:0;">
        Des questions ? Répondez simplement à cet email,<br>
        notre équipe est là pour vous aider.
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#fafaf9;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;font-size:13px;color:#d97706;font-weight:700;letter-spacing:-0.01em;">
        &#127860; RestaurantOS
      </p>
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        La plateforme tout-en-un pour les restaurants en Afrique de l'Ouest.
      </p>
    </div>

  </div>
</body>
</html>`;

    await sendMail({
        to: email,
        subject: `Bienvenue sur RestaurantOS, ${fullName} ! 🎉`,
        html,
    });
}
