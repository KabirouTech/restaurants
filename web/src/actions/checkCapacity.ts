"use server";

import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

// IMPORTANT: This should be run on the server side to use SERVICE ROLE key if needed,
// but for checking only, ANON key is fine if RLS allows reading.
// For now we assume using the standard client.

export type AvailabilityRequest = {
    checkDate: string; // YYYY-MM-DD
    organizationId: string;
    loadCost: number;
};

export type AvailabilityResponse = {
    available: boolean;
    currentLoad: number;
    maxLimit: number;
    remaining: number;
    reason?: string;
    error?: string;
};

export async function checkCapacityAction(
    req: AvailabilityRequest
): Promise<AvailabilityResponse> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

        // We create a fresh client here to ensure we don't leak context, 
        // though typically you'd use a shared client or cookies() for auth context.
        // @ts-ignore - Database type mismatch issues are common manually defined
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.rpc("check_availability", {
            p_org_id: req.organizationId,
            p_check_date: req.checkDate,
            p_new_load_cost: req.loadCost,
        });

        if (error) {
            console.error("RPC Error:", error);
            return {
                available: false,
                currentLoad: 0,
                maxLimit: 0,
                remaining: 0,
                error: error.message
            };
        }

        // The RPC returns { available, current_load, etc. } 
        // But since the return type in TypeScript definition might be inferred differently, 
        // let's cast or map it safely.
        // The RPC function returns a JSON object.

        // Casting data to expected shape as the generated type for RPC return is tricky without codegen
        const result = data as any;

        return {
            available: result.available,
            currentLoad: result.current_load,
            maxLimit: result.max_limit,
            remaining: result.remaining,
            reason: result.reason,
        };

    } catch (err: any) {
        console.error("Server Action Error:", err);
        return {
            available: false,
            currentLoad: 0,
            maxLimit: 0,
            remaining: 0,
            error: err.message
        };
    }
}
