
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkCapacityTypes() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const orgId = "986495e5-00c9-4ad8-ae06-ac58191f2cbb"; // Mahamad Store Test

    const { data: caps, error } = await supabase
        .from("capacity_types")
        .select("*")
        .eq("organization_id", orgId);

    if (error) console.error(error);
    else console.log(`Capacity Types for ${orgId}:`, caps);

    const { data: custs } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", orgId);

    console.log(`Customers for ${orgId}:`, custs);
}

checkCapacityTypes();
