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
        <div
            className={`fixed inset-0 z-[100] bg-background text-foreground overflow-y-auto ${inter.variable} ${dmSans.variable} ${playfair.variable}`}
        >
            {/* Dot grid background */}
            <div className="fixed inset-0 pattern-grid opacity-[0.15] pointer-events-none dark:opacity-[0.05]" />

            {/* Decorative gradient orbs */}
            <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="fixed bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 min-h-full flex items-center justify-center p-4 md:p-8">
                {children}
            </div>
        </div>
    );
}
