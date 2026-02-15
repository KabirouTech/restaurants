
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSchema() {
    console.log("Testing Orders Schema...");

    // Get a valid Org ID first
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    const orgId = orgs[0]?.id;

    if (!orgId) {
        console.error("No organizations found to test with.");
        return;
    }

    // Get a valid Customer ID
    const { data: customers } = await supabase.from('customers').select('id').eq('organization_id', orgId).limit(1);
    let customerId = customers?.[0]?.id;

    if (!customerId) {
        // Create dummy customer
        const { data: newCustomer, error: cError } = await supabase.from('customers').insert({
            organization_id: orgId,
            full_name: "Test Customer",
            email: "test@test.com"
        }).select().single();
        if (cError) {
            console.error("Failed to create dummy customer:", cError);
            return;
        }
        customerId = newCustomer.id;
    }

    // Try inserting an order with all columns we expect
    const payload = {
        organization_id: orgId,
        customer_id: customerId,
        total_amount_cents: 1000,
        status: 'pending',
        event_date: '2025-01-01',
        internal_notes: 'Test Note'
    };

    console.log("Attempting insert with payload:", payload);

    const { data, error } = await supabase.from('orders').insert(payload).select();

    if (error) {
        console.error("Insert Failed:", error);

        // If updating notes failed, try without it to isolate
        if (error.message.includes('column')) {
            console.log("Retrying without internal_notes...");
            const p2 = { ...payload };
            delete p2.internal_notes;
            const res2 = await supabase.from('orders').insert(p2).select();
            if (res2.error) console.error("Retry 1 Failed:", res2.error);
            else console.log("Retry 1 Success (internal_notes missing)");

            console.log("Retrying without event_date...");
            const p3 = { ...payload };
            delete p3.event_date;
            const res3 = await supabase.from('orders').insert(p3).select();
            if (res3.error) console.error("Retry 2 Failed:", res3.error);
            else console.log("Retry 2 Success (event_date missing)");
        }

    } else {
        console.log("Insert Success!", data);
        // Clean up
        await supabase.from('orders').delete().eq('id', data[0].id);
    }
}

testSchema();
