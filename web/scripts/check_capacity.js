const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    const { data, error } = await supabase.from('capacity_types').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Capacity Types:", data);
        if (!data || data.length === 0) {
            console.log("No capacity types found. Inserting defaults...");
            // Insert defaults if empty (assuming org exists)
            // Check for an org
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) {
                const orgId = orgs[0].id;
                const { error: insertError } = await supabase.from('capacity_types').insert([
                    { organization_id: orgId, name: 'Sur Place', load_cost: 1, color: '#10B981', is_active: true },
                    { organization_id: orgId, name: 'Emporté', load_cost: 0, color: '#3B82F6', is_active: true },
                    { organization_id: orgId, name: 'Livraison', load_cost: 0, color: '#F59E0B', is_active: true },
                    { organization_id: orgId, name: 'Traiteur', load_cost: 5, color: '#8B5CF6', is_active: true }
                ]);
                if (insertError) console.error("Insert Error:", insertError);
                else console.log("Inserted default capacity types.");
            } else {
                console.log("No organization found to seed capacity types.");
            }
        }
    }
}

check();
