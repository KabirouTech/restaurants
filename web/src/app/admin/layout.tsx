import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-[100dvh] overflow-hidden bg-muted/10">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto h-full w-full">
                {children}
            </main>
        </div>
    );
}
