const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("🔍 Diagnosing Database State...");

    // 1. Check if the RPC function exists (This proves if Migration was run)
    const { data, error } = await supabase.rpc('check_availability', {
        p_org_id: '00000000-0000-0000-0000-000000000000',
        p_check_date: '2024-01-01'
    });

    if (error) {
        console.error("❌ Function check_availability failed:", error.message);
        if (error.message.includes("function") && error.message.includes("does not exist")) {
            console.log("\n⚠️  CONCLUSION: The Database Migration was NEVER run.");
            console.log("   The tables and functions do not exist yet.");
            console.log("   You need to run the SQL file in Supabase Dashboard > SQL Editor.");
        } else {
            console.log("\n⚠️  There is a different issue (maybe cache?).");
        }
    } else {
        console.log("✅ Function check_availability exists. Migration WAS run.");
        console.log("   This means it is purely a Cache Issue.");
        console.log("   Action: Go to Supabase Dashboard > API > Settings > Reload Schema Cache.");
    }
}

diagnose();
