"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getToken } from "@/lib/auth/storage";
import Link from "next/link";

interface User {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    status: string;
    createdAt: string;
}

export default function UsersManagement() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ role: "", status: "", search: "" });
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            router.push("/login");
            return;
        }
        fetchUsers();
    }, [user, authLoading, router, filters, page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.role) params.append("role", filters.role);
            if (filters.status) params.append("status", filters.status);
            if (filters.search) params.append("search", filters.search);
            params.append("page", String(page));
            params.append("limit", String(limit));

            const token = getToken();
            const response = await fetch(`/api/admin/users?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId: string, newStatus: string) => {
        try {
            const action = newStatus === "active"
                ? "activate"
                : newStatus === "suspended"
                    ? "suspend"
                    : "ban";
            const endpoint = `/api/admin/users/${userId}/${action}`;
            const token = getToken();
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });
            const data = await response.json();
            if (data.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to update user status:", error);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            const token = getToken();
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
            });
            const data = await response.json();
            if (data.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-2">Manage and monitor all user accounts</p>
                    </div>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={filters.search}
                            onChange={(e) => {
                                setFilters({ ...filters, search: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={filters.role}
                            onChange={(e) => {
                                setFilters({ ...filters, role: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Roles</option>
                            <option value="customer">Customer</option>
                            <option value="host">Host</option>
                            <option value="admin">Admin</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => {
                                setFilters({ ...filters, status: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="banned">Banned</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">No users found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{u.fullName}</td>
                                            <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{u.phoneNumber}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold capitalize">
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={u.status}
                                                    onChange={(e) => handleStatusChange(u._id, e.target.value)}
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold border-0 cursor-pointer ${u.status === "active"
                                                        ? "bg-green-100 text-green-800"
                                                        : u.status === "suspended"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="suspended">Suspend</option>
                                                    <option value="banned">Ban</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(u.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(u._id)}
                                                    className="text-red-600 hover:text-red-800 font-semibold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && users.length > 0 && (
                        <div className="px-6 py-4 border-t flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                Showing page {page} of {Math.ceil(total / limit)} ({total} total users)
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-200"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                                    disabled={page >= Math.ceil(total / limit)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
