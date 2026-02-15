const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testAdminWrite() {
    console.log("Testing Admin Write Access...");

    const testSlug = `test-write-${Date.now()}`;

    // Try to INSERT
    const { data, error } = await supabase
        .from('organizations')
        .insert({
            name: 'Test Write',
            slug: testSlug,
            subscription_plan: 'test'
        })
        .select()
        .single();

    if (error) {
        console.error("❌ Insert Failed:", error.message);
        if (error.message.includes("Could not find the table")) {
            console.log("👉 Suggestion: Go to Supabase Dashboard > API > Settings and click 'Reload Schema Cache'");
        }
    } else {
        console.log("✅ Admin Write SUCCESS. Created Org ID:", data.id);

        // Cleanup
        await supabase.from('organizations').delete().eq('id', data.id);
        console.log("✅ Cleanup Successful.");
    }
}

testAdminWrite();
