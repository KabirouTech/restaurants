import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseJwtTemplate = process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            global: {
                fetch: async (url, options = {}) => {
                    // Native Clerk↔Supabase integration: the session token carries
                    // the "role": "authenticated" claim (Clerk dashboard → Supabase
                    // integration) and Supabase validates it as third-party auth.
                    // NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE remains as a legacy
                    // override for the deprecated JWT-template flow.
                    let clerkToken = null;
                    try {
                        // @ts-expect-error Clerk is injected on window by the Clerk frontend runtime.
                        clerkToken = await window.Clerk?.session?.getToken(
                            supabaseJwtTemplate ? { template: supabaseJwtTemplate } : undefined
                        );
                    } catch (error) {
                        const message = error instanceof Error ? error.message : String(error);
                        console.warn(
                            `[supabase] Clerk session token unavailable (${message}). Continuing without Authorization header.`
                        );
                    }
                    const headers = new Headers(options?.headers)
                    if (clerkToken) {
                        headers.set('Authorization', `Bearer ${clerkToken}`)
                    }

                    return fetch(url, {
                        ...options,
                        headers,
                    })
                },
            },
        }
    )
}
