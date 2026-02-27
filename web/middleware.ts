import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/utils/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'never',
    localeDetection: false,
});

export async function middleware(request: NextRequest) {
    // Run intl middleware first (sets locale header for server components)
    const intlResponse = intlMiddleware(request);
    if (intlResponse && intlResponse.status !== 200) return intlResponse;

    // Then run Supabase session update
    return await updateSession(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
