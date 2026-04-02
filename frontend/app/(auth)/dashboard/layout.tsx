import Header from "@/app/(auth)/dashboard/_components/Header";
import Sidebar from "@/app/(auth)/dashboard/_components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 pl-3 pt-4 pr-4 pb-4 lg:pl-3 lg:pt-8 lg:pr-8 lg:pb-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}