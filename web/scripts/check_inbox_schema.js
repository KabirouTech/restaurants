const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Checking Inbox Schema...');

    const tables = ['conversations', 'messages', 'channels', 'customers'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.log(`❌ Table '${table}' does NOT exist or is inaccessible:`, error.message);
        } else {
            console.log(`✅ Table '${table}' exists.`);
        }
    }
}

checkSchema();
