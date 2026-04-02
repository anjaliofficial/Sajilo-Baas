"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getToken } from "@/lib/auth/storage";
import Link from "next/link";

interface Report {
    _id: string;
    messageId: string;
    reportedByUserId: string;
    reportedUserId: string;
    reason: string;
    description: string;
    status: "pending" | "reviewed" | "resolved" | "dismissed";
    actionTaken?: "warn" | "mute" | "ban" | "none";
    createdAt: string;
}

export default function ReportsManagement() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        reason: "",
    });
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            router.push("/login");
            return;
        }
        fetchReports();
    }, [user, authLoading, router, filters, page]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.reason) params.append("reason", filters.reason);
            params.append("page", String(page));
            params.append("limit", String(limit));

            const token = getToken();
            const response = await fetch(
                `/api/admin/reports?${params}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }
            );
            const data = await response.json();
            if (data.success) {
                setReports(data.reports);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReportAction = async (reportId: string, action: string) => {
        try {
            const token = getToken();
            const response = await fetch(
                `/api/admin/reports/${reportId}/action`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ action }),
                }
            );
            const data = await response.json();
            if (data.success) {
                fetchReports();
            }
        } catch (error) {
            console.error("Failed to take action on report:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "resolved":
                return "bg-green-100 text-green-800";
            case "dismissed":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-blue-100 text-blue-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
                        <p className="text-gray-600 mt-2">Review and manage reported messages and users</p>
                    </div>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={filters.status}
                            onChange={(e) => {
                                setFilters({ ...filters, status: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>

                        <select
                            value={filters.reason}
                            onChange={(e) => {
                                setFilters({ ...filters, reason: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Reasons</option>
                            <option value="spam">Spam</option>
                            <option value="abuse">Abuse</option>
                            <option value="harassment">Harassment</option>
                            <option value="inappropriate_content">Inappropriate Content</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-500">Loading reports...</div>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-500">No reports found</div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Report ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Reported User
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Reason
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {reports.map((report) => (
                                            <tr key={report._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {report._id.slice(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                    {report.reportedUserId.slice(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                                        {report.reason}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                        {report.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {report.status === "pending" && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleReportAction(report._id, "mute")}
                                                                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                                            >
                                                                Mute
                                                            </button>
                                                            <button
                                                                onClick={() => handleReportAction(report._id, "ban")}
                                                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                            >
                                                                Ban
                                                            </button>
                                                            <button
                                                                onClick={() => handleReportAction(report._id, "dismiss")}
                                                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} reports
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
