
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkOrders() {
    console.log("Checking orders...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Error: Missing env variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("organization_id", "986495e5-00c9-4ad8-ae06-ac58191f2cbb");

    if (error) {
        console.error("Error fetching orders:", error);
    } else {
        console.log(`Found ${orders.length} orders:`);
        orders.forEach(o => {
            console.log(`- ID: ${o.id}, Date: ${o.event_date}, OrgID: ${o.organization_id}, Status: ${o.status}`);
        });
    }
}

checkOrders();
