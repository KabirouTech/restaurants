
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkOrgs() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get all organizations
    const { data: orgs } = await supabase.from('organizations').select('id, name, slug');
    console.log("Organizations:", orgs);

    // Get all profiles with their orgs
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, organization_id, email');
    // Note: 'email' is in auth.users, not profiles usually, but sometimes stored here too. 
    // If not in profiles, we can't easily see it without joining auth.users which is restricted to service key usually.
    // Let's just list profiles.
    console.log("Profiles:", profiles);
}

checkOrgs();
