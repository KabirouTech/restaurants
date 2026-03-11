"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

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

    revalidatePath("/", "layout");
    return { success: true, orgId: org.id };
}
