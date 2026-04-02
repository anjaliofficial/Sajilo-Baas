"use client";

import { useAuth } from "@/app/admin/context/AuthContext";

export default function ProtectedRoute({
    children,
    adminOnly = false,
}: {
    children: React.ReactNode;
    adminOnly?: boolean;
}) {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-md text-center w-[350px]">
                    <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
                    <p className="text-gray-600 mb-4">
                        Please login to access this page.
                    </p>
                    <span className="text-sm text-gray-400">
                        Admin access only
                    </span>
                </div>
            </div>
        );
    }

    if (adminOnly && user.role !== "admin") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="bg-white p-8 rounded-xl shadow-md text-center w-[350px]">
                    <h2 className="text-xl font-bold text-red-600 mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-600">
                        You do not have permission to view this page.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
