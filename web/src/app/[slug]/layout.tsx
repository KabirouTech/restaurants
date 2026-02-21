import { ThemeProvider } from "@/components/theme-provider";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
            attribute="class"
            forcedTheme="light"
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}
