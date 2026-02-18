"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function createOrganizationAction(formData: FormData) {
    // 1. Verify User Authentication (Standard Client)
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
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
            settings: { description },
        })
        .select()
        .single();

    if (orgError) {
        console.error("Org Error:", orgError);
        return { error: "Erreur lors de la création de l'organisation: " + orgError.message };
    }

    // 4. Create/Link User Profile (Admin)
    // We use adminClient to insert into 'profiles' even though it's the user's profile, 
    // because RLS might be blocking 'INSERT' if not configured.
    const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({
            id: user.id,
            organization_id: org.id,
            full_name: fullName,
            role: "admin",
        });

    if (profileError) {
        console.error("Profile Error:", profileError);
        return { error: "Erreur lors de la création du profil: " + profileError.message };
    }

    // 5. Add Services (Capacity Types)
    const servicesJson = formData.get("services") as string;
    if (servicesJson) {
        const services = JSON.parse(servicesJson);
        if (services.length > 0) {
            const inserts = services.map((s: any) => ({
                organization_id: org.id,
                name: s.name,
                load_cost: parseInt(s.loadCost),
                color_code: s.color,
            }));
            const { error: serviceError } = await adminClient.from("capacity_types").insert(inserts);
            if (serviceError) console.error("Service Error:", serviceError);
        }
    }

    // 6. Add Menu Items (Products)
    const menuItemsJson = formData.get("menuItems") as string;
    if (menuItemsJson) {
        const menuItems = JSON.parse(menuItemsJson);
        if (menuItems.length > 0) {
            const productInserts = menuItems.map((p: any) => ({
                organization_id: org.id,
                name: p.name,
                description: p.description,
                price_cents: Math.round(parseFloat(p.price || "0") * 100),
                category: p.category,
                image_url: p.imageUrl,
            }));
            const { error: productError } = await adminClient.from("products").insert(productInserts);
            if (productError) console.error("Product Error:", productError);
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

    revalidatePath("/dashboard");
    return { success: true, orgId: org.id };
}
