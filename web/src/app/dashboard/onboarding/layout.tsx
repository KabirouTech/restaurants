import { Inter, DM_Sans, Playfair_Display } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-dm" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`min-h-screen bg-background text-foreground flex items-center justify-center p-4 md:p-8 ${inter.variable} ${dmSans.variable} ${playfair.variable}`}>
            {/* Subtle Background */}
            <div className="fixed inset-0 pattern-grid opacity-[0.2] pointer-events-none -z-10 mix-blend-multiply dark:opacity-[0.05]"></div>

            {children}
        </div>
    );
}
