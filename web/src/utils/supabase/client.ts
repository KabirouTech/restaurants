import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            global: {
                fetch: async (url, options = {}) => {
                    let clerkToken = null;
                    try {
                        // @ts-ignore
                        clerkToken = await window.Clerk?.session?.getToken({ template: 'supabase' });
                    } catch (error) {
                        console.warn('Clerk: Supabase JWT template not found.');
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
