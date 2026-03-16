import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/i18n/config'

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'never',
    localeDetection: false,
});

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
    // Run intl middleware first (sets locale header for server components)
    const intlResponse = intlMiddleware(request);

    // If intl middleware decided to redirect/rewrite (status !== 200), return it immediately
    if (intlResponse && intlResponse.status !== 200) return intlResponse;

    // Protect dashboard and admin routes — Clerk handles redirect to /sign-in
    if (isProtectedRoute(request)) {
        await auth.protect();
    }

    return NextResponse.next({
        request: {
            headers: request.headers,
        },
    });
});

export const config = {
    matcher: [
        // Match everything except static assets and Next.js internals
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
