import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseJwtTemplate = process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            global: {
                fetch: async (url, options = {}) => {
                    let clerkToken = null;
                    if (supabaseJwtTemplate) {
                        try {
                            // @ts-expect-error Clerk is injected on window by the Clerk frontend runtime.
                            clerkToken = await window.Clerk?.session?.getToken({ template: supabaseJwtTemplate });
                        } catch (error) {
                            const message = error instanceof Error ? error.message : String(error);
                            console.warn(
                                `[supabase] Clerk token template "${supabaseJwtTemplate}" unavailable (${message}). Continuing without Authorization header.`
                            );
                        }
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
