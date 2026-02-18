
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function setupStorage() {
    console.log("Setting up Supabase Storage...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("Error: Missing env variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
        return;
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
    });

    // Create 'organizations' bucket
    const { data, error } = await supabaseAdmin.storage.createBucket('organizations', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    });

    if (error) {
        if (error.message.includes("already exists")) {
            console.log("Bucket 'organizations' already exists.");
        } else {
            console.error("Error creating bucket:", error);
        }
    } else {
        console.log("Bucket 'organizations' created successfully.");
    }

    // List buckets to confirm
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
        console.error("Error listing buckets:", listError);
    } else {
        console.log("Current buckets:", buckets.map(b => b.name));
    }
}

setupStorage();
