import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
const supabaseJwtTemplate = process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      let clerkToken = null;
      if (supabaseJwtTemplate) {
        try {
          const clerkWindow = typeof window !== 'undefined' ? (window as Window & {
            Clerk?: {
              session?: {
                getToken: (input: { template: string }) => Promise<string | null>
              }
            }
          }) : null
          clerkToken = clerkWindow
            ? await clerkWindow.Clerk?.session?.getToken({ template: supabaseJwtTemplate })
            : null;
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
})
