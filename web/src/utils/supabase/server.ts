import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

export async function createClient() {
    const cookieStore = await cookies()
    const { userId, getToken } = await auth()
    const supabaseJwtTemplate = process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE

    let clerkToken = null
    if (userId && supabaseJwtTemplate) {
        try {
            clerkToken = await getToken({ template: supabaseJwtTemplate })
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.warn(
                `[supabase] Clerk token template "${supabaseJwtTemplate}" unavailable (${message}). Falling back to service role key.`
            )
        }
    }

    // Use service role key when no Clerk JWT is available.
    // To enable Clerk JWT for Supabase RLS, set NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE.
    // This bypasses RLS but auth is already handled by Clerk middleware
    const supabaseKey = clerkToken
        ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
        : process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey,
        {
            global: {
                headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : undefined,
                fetch: (url, options) => {
                    return fetch(url, { ...options, cache: 'no-store', next: { revalidate: 0 } });
                }
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignore headers
                    }
                },
            },
        }
    )
}
