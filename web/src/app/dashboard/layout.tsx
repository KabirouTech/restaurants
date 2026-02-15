import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden bg-muted/10">
            <Sidebar />
            <main className="flex-1 overflow-y-auto h-full w-full">
                {children}
            </main>
        </div>
    );
}
