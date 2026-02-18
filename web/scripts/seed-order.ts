
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function seedOrder() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const orgId = "986495e5-00c9-4ad8-ae06-ac58191f2cbb"; // Mahamad Store Test
    const capTypeId = "b3c8b13e-aab0-43fb-b127-d3f26ae8ce54"; // Mariage

    // 1. Create Customer
    const { data: customer, error: custError } = await supabase
        .from("customers")
        .insert({
            organization_id: orgId,
            full_name: "Test User Manual",
            email: "manual@test.com",
            phone: "123456789"
        })
        .select()
        .single();

    if (custError) {
        console.error("Customer Error", custError);
        return;
    }
    console.log("Customer Created:", customer.id);

    // 2. Create Order
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
            organization_id: orgId,
            customer_id: customer.id,
            capacity_type_id: capTypeId,
            event_date: "2026-02-19",
            event_time: "14:00",
            guest_count: 50,
            status: "confirmed",
            total_amount_cents: 10000
        })
        .select()
        .single();

    if (orderError) {
        console.error("Order Error", orderError);
    } else {
        console.log("Order Created:", order.id, "Date:", order.event_date);
    }
}

seedOrder();
