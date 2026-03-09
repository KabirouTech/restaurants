import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToaster } from "@/components/ThemeToaster";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dm" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
    title: "Restaurant OS - La Teranga Digitale",
    description: "La plateforme pour les traiteurs qui veulent voir grand.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} className={`${inter.variable} ${dmSans.variable} ${outfit.variable} ${playfair.variable}`} suppressHydrationWarning>
            <body className="font-outfit antialiased bg-background text-foreground min-h-screen">
                <ClerkProvider
                    appearance={{
                        variables: {
                            colorPrimary: "#e67e22",
                            colorText: "#2f2119",
                            borderRadius: "0.75rem",
                        },
                        elements: {
                            formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                            profileSectionPrimaryButton: "bg-primary hover:bg-primary/90 text-primary-foreground",
                            footerActionLink: "text-primary hover:text-primary/80",
                            card: "shadow-2xl border border-primary/25",
                        },
                    }}
                >
                    {/* Clerk header buttons removed — auth is handled via /sign-in, /sign-up pages and account is opened from sidebar */}
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <NextIntlClientProvider messages={messages}>
                            {/* Subtle Warm Pattern */}
                            <div className="fixed inset-0 pattern-grid opacity-[0.3] pointer-events-none -z-10 mix-blend-multiply dark:opacity-[0.05] dark:mix-blend-normal"></div>

                            {children}
                            <ThemeToaster />
                        </NextIntlClientProvider>
                    </ThemeProvider>
                </ClerkProvider>
            </body>
        </html>
    );
}
