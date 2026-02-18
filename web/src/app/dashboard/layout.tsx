import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-muted/10 print:h-auto print:overflow-visible print:bg-white">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-full w-full print:h-auto print:w-full print:overflow-visible">
                {children}
            </main>
        </div>
    );
}
