
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testSlugCheck() {
    console.log("Testing Slug Uniqueness Logic...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Error: Missing env variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
        return;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
    });

    // 1. Fetch current organizations
    const { data: orgs, error } = await supabaseAdmin.from("organizations").select("id, slug, name");
    if (error) {
        console.error("Error fetching orgs:", error);
        return;
    }

    if (!orgs || orgs.length === 0) {
        console.log("No organizations found to test with.");
        return;
    }

    console.log(`Found ${orgs.length} organizations:`);
    orgs.forEach(org => console.log(`- ${org.name} (${org.slug}) [ID: ${org.id}]`));

    // 2. Simulate the check logic from the server action
    // Case A: Check a slug that IS taken by another org
    if (orgs.length >= 1) {
        const targetOrg = orgs[0];
        const otherOrgId = "00000000-0000-0000-0000-000000000000"; // Sims a different user's org ID
        const slugToTest = targetOrg.slug;

        console.log(`\nTest A: Checking slug "${slugToTest}" for a different org ID (${otherOrgId})...`);
        console.log("Expected result: Should find a conflict.");

        const { data: slugCheck } = await supabaseAdmin
            .from("organizations")
            .select("id")
            .eq("slug", slugToTest)
            .neq("id", otherOrgId)
            .maybeSingle();

        if (slugCheck) {
            console.log("✅ SUCCESS: Conflict correctly detected!", slugCheck);
        } else {
            console.error("❌ FAILURE: Conflict NOT detected!");
        }
    }

    // Case B: Check a slug that is NOT taken
    const freeSlug = "completely-random-unused-slug-" + Date.now();
    const someOrgId = orgs[0].id;

    console.log(`\nTest B: Checking unused slug "${freeSlug}"...`);
    console.log("Expected result: Should NOT find a conflict.");

    const { data: slugCheckFree } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("slug", freeSlug)
        .neq("id", someOrgId)
        .maybeSingle();

    if (!slugCheckFree) {
        console.log("✅ SUCCESS: No conflict detected (as expected).");
    } else {
        console.error("❌ FAILURE: Conflict detected when there shouldn't be one!", slugCheckFree);
    }
}

testSlugCheck();
