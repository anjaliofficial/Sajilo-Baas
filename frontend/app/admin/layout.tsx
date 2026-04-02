"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import AdminSidebar from "@/app/admin/_components/AdminSidebar";
import SecurityDisclaimer from "@/app/admin/_components/SecurityDisclaimer";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            router.push("/login");
            return;
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <SecurityDisclaimer />
                    {children}
                </div>
            </main>
        </div>
    );
}
