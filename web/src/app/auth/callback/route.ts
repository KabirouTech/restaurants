import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    const supabase = await createClient()

    // Case 1: OAuth Code Exchange
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error("Auth Code Exchange Error:", error.message)
        }
    }

    // Case 2: Email Otp/Magic Link Verification
    else if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            // redirect user to specified redirect URL or root of app
            // Using origin/next logic here as well for consistency
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error("Auth OTP Verify Error:", error.message)
        }
    }

    // return the user to an error page with some instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
