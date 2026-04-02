"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getToken } from "@/lib/auth/storage";
import Link from "next/link";

interface AuditLog {
    _id: string;
    adminId: string;
    action: string;
    targetUserId?: string;
    targetEntityId?: string;
    details: Record<string, any>;
    createdAt: string;
}

export default function AuditLogs() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(30);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            router.push("/login");
            return;
        }
        fetchLogs();
    }, [user, authLoading, router, page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append("page", String(page));
            params.append("limit", String(limit));

            const token = getToken();
            const response = await fetch(
                `/api/admin/reports/logs?${params}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }
            );
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes("banned")) return "text-red-600";
        if (action.includes("muted")) return "text-orange-600";
        if (action.includes("restricted")) return "text-yellow-600";
        if (action.includes("report")) return "text-blue-600";
        return "text-gray-600";
    };

    const formatAction = (action: string) => {
        return action.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                        <p className="text-gray-600 mt-2">View all admin actions and system events</p>
                    </div>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Logs Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-500">Loading audit logs...</div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-500">No audit logs found</div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Timestamp
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Admin ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Action
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Target User
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {logs.map((log) => (
                                            <tr key={log._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {log.adminId.slice(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    <span className={getActionColor(log.action)}>
                                                        {formatAction(log.action)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {log.targetUserId ? log.targetUserId.slice(0, 8) + "..." : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <details className="cursor-pointer">
                                                        <summary className="text-blue-600 hover:text-blue-800">
                                                            View
                                                        </summary>
                                                        <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                                                            {JSON.stringify(log.details, null, 2)}
                                                        </div>
                                                    </details>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} logs
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page * limit >= total}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
