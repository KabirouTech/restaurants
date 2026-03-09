import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      let clerkToken = null;
      try {
        // @ts-ignore
        clerkToken = typeof window !== 'undefined' ? await window.Clerk?.session?.getToken({ template: 'supabase' }) : null;
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
})
