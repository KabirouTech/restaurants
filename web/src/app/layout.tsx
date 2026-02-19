import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dm" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Restaurant OS - La Teranga Digitale",
  description: "La plateforme pour les traiteurs qui veulent voir grand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${dmSans.variable} ${outfit.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-outfit antialiased bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Subtle Warm Pattern */}
          <div className="fixed inset-0 pattern-grid opacity-[0.3] pointer-events-none -z-10 mix-blend-multiply dark:opacity-[0.05] dark:mix-blend-normal"></div>

          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
