import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Admin routes: require authentication + super admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_super_admin) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    if (request.nextUrl.pathname.startsWith('/auth') && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}
