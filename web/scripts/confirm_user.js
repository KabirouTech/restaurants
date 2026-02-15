const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function confirmUser(email) {
    // 1. Get user by email (indirectly via list users or admin method)
    // Unfortunately getUser(email) is not direct in admin API sometimes, usually listUsers()

    console.log(`Searching for user: ${email}...`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("List Error:", listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log("User not found via list. Trying to create or invite instead (optional).");
        // Actually, if rate limit exceeded, user might exist but unverified
        return;
    }

    console.log(`Found user ${user.id}. Confirming email...`);

    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true, user_metadata: { email_verified: true } }
    );

    if (error) {
        console.error("Error verifying user:", error.message);
    } else {
        console.log(`Success! User ${email} is now VERIFIED.`);
    }
}

// Get email from args
const email = process.argv[2];
if (!email) {
    console.log("Usage: node scripts/confirm_user.js <email>");
} else {
    confirmUser(email);
}
