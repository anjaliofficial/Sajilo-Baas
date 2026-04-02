"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getToken } from "@/lib/auth/storage";

interface DashboardStats {
    users: {
        total: number;
        customers: number;
        hosts: number;
        activeUsers: number;
        suspendedUsers: number;
        bannedUsers: number;
    };
    listings: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    bookings: {
        total: number;
        completed: number;
        pending: number;
        confirmed: number;
        cancelled: number;
    };
    messages: {
        total: number;
    };
    // Transaction management removed - not needed for now
    // transactions: {
    //     totalRevenue: number;
    //     completed: number;
    //     pending: number;
    //     failed: number;
    //     refunded: number;
    // };
    recentActivity: {
        users: any[];
        listings: any[];
        bookings: any[];
    };
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            router.push("/login");
            return;
        }

        fetchStats();
    }, [user, authLoading, router]);

    const fetchStats = async () => {
        try {
            const token = getToken();
            const response = await fetch("/api/admin/dashboard/stats", {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl font-semibold">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage users, listings, and bookings</p>
                </div>

                {/* Navigation Cards */}
                <button
                    type="button"
                    onClick={() => router.push("/admin/reviews")}
                    className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition text-left w-full mb-4"
                >
                    <div className="text-3xl font-bold text-yellow-600">Reviews</div>
                    <p className="text-gray-600 mt-2">View your given and taken reviews</p>
                    <span className="text-sm text-yellow-600 mt-4 block">View Reviews →</span>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/users")}
                        className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition text-left"
                    >
                        <div className="text-3xl font-bold text-blue-600">{stats?.users.total || 0}</div>
                        <p className="text-gray-600 mt-2">Total Users</p>
                        <span className="text-sm text-blue-600 mt-4 block">Manage Users →</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/admin/listings")}
                        className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition text-left"
                    >
                        <div className="text-3xl font-bold text-green-600">{stats?.listings.total || 0}</div>
                        <p className="text-gray-600 mt-2">Total Listings</p>
                        <span className="text-sm text-green-600 mt-4 block">
                            Pending: {stats?.listings.pending}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/admin/messages")}
                        className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition text-left"
                    >
                        <div className="text-3xl font-bold text-indigo-600">{stats?.messages.total || 0}</div>
                        <p className="text-gray-600 mt-2">Total Messages</p>
                        <span className="text-sm text-indigo-600 mt-4 block">View Messages →</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/admin/reports")}
                        className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition text-left"
                    >
                        <div className="text-3xl font-bold text-red-600">Reports</div>
                        <p className="text-gray-600 mt-2">Reported Messages</p>
                        <span className="text-sm text-red-600 mt-4 block">Review Reports →</span>
                    </button>
                    {/* <Link href="/admin/transactions">
                        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                            <div className="text-3xl font-bold text-orange-600">
                                NPR {stats?.transactions.totalRevenue.toLocaleString() || 0}
                            </div>
                            <p className="text-gray-600 mt-2">Total Revenue</p>
                            <span className="text-sm text-orange-600 mt-4 block">View Transactions →</span>
                        </div>
                    </Link> */}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* User Stats */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">User Statistics</h2>
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Customers</span>
                                <span className="font-semibold">{stats?.users.customers || 0}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Hosts</span>
                                <span className="font-semibold">{stats?.users.hosts || 0}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Active Users</span>
                                <span className="font-semibold text-green-600">
                                    {stats?.users.activeUsers || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Suspended</span>
                                <span className="font-semibold text-yellow-600">
                                    {stats?.users.suspendedUsers || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Banned</span>
                                <span className="font-semibold text-red-600">
                                    {stats?.users.bannedUsers || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Listing Stats */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Listing Statistics</h2>
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Approved</span>
                                <span className="font-semibold text-green-600">
                                    {stats?.listings.approved || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Pending Approval</span>
                                <span className="font-semibold text-yellow-600">
                                    {stats?.listings.pending || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Rejected</span>
                                <span className="font-semibold text-red-600">
                                    {stats?.listings.rejected || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Total Listings</span>
                                <span className="font-semibold">{stats?.listings.total || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Booking Stats */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Booking Statistics</h2>
                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Completed</span>
                                <span className="font-semibold text-green-600">
                                    {stats?.bookings.completed || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Confirmed</span>
                                <span className="font-semibold text-blue-600">
                                    {stats?.bookings.confirmed || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2.5">
                                <span className="text-gray-600">Pending</span>
                                <span className="font-semibold text-yellow-600">
                                    {stats?.bookings.pending || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Cancelled</span>
                                <span className="font-semibold text-red-600">
                                    {stats?.bookings.cancelled || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Stats - Removed (Not needed for now) */}
                    {/* <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction Statistics</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-gray-600">Completed</span>
                                <span className="font-semibold text-green-600">
                                    {stats?.transactions.completed || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-gray-600">Pending</span>
                                <span className="font-semibold text-yellow-600">
                                    {stats?.transactions.pending || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-gray-600">Failed</span>
                                <span className="font-semibold text-red-600">
                                    {stats?.transactions.failed || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Refunded</span>
                                <span className="font-semibold text-orange-600">
                                    {stats?.transactions.refunded || 0}
                                </span>
                            </div>
                        </div>
                    </div> */}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Users */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Recent Users</h2>
                        <div className="space-y-3">
                            {stats?.recentActivity.users.map((u: any) => (
                                <div key={u._id} className="border-b pb-2 last:border-b-0">
                                    <p className="font-semibold text-gray-900">{u.fullName}</p>
                                    <p className="text-sm text-gray-600">{u.email}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{u.role}</span>
                                        <span
                                            className={`text-xs px-2 py-1 rounded font-semibold ${u.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : u.status === "suspended"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {u.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Listings */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">Recent Listings</h2>
                        <div className="space-y-3">
                            {stats?.recentActivity.listings.map((listing: any) => (
                                <div key={listing._id} className="border-b pb-2 last:border-b-0">
                                    <p className="font-semibold text-gray-900">{listing.title}</p>
                                    <p className="text-sm text-gray-600">{listing.location}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-600">{listing.hostId?.fullName}</span>
                                        <span
                                            className={`text-xs px-2 py-1 rounded font-semibold ${listing.status === "approved"
                                                ? "bg-green-100 text-green-800"
                                                : listing.status === "pending"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {listing.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Bookings */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
                        <div className="space-y-3">
                            {stats?.recentActivity.bookings.map((booking: any) => (
                                <div key={booking._id} className="border-b pb-2 last:border-b-0">
                                    <p className="font-semibold text-gray-900">{booking.customerId?.fullName}</p>
                                    <p className="text-sm text-gray-600">{booking.listingId?.title}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs font-semibold">NPR {booking.totalPrice}</span>
                                        <span
                                            className={`text-xs px-2 py-1 rounded font-semibold ${booking.status === "completed"
                                                ? "bg-green-100 text-green-800"
                                                : booking.status === "confirmed"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                                        >
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
