"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getToken } from "@/lib/auth/storage";
import Link from "next/link";

interface Booking {
    _id: string;
    listingId: { title: string; location: string };
    customerId: { fullName: string; email: string };
    hostId: { fullName: string; email: string };
    status: string;
    paymentStatus: string;
    totalPrice: number;
    totalNights: number;
    checkInDate: string;
    checkOutDate: string;
    createdAt: string;
}

export default function BookingsManagement() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        paymentStatus: "",
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
        fetchBookings();
    }, [user, authLoading, router, filters, page]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
            params.append("page", String(page));
            params.append("limit", String(limit));

            const token = getToken();
            const response = await fetch(`/api/admin/bookings?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                setBookings(data.bookings);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (bookingId: string) => {
        try {
            const token = getToken();
            const response = await fetch(`/api/admin/bookings?action=confirm&id=${bookingId}`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                fetchBookings();
            }
        } catch (error) {
            console.error("Failed to confirm booking:", error);
        }
    };

    const handleCancel = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        try {
            const token = getToken();
            const response = await fetch(`/api/admin/bookings?action=cancel&id=${bookingId}`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                fetchBookings();
            }
        } catch (error) {
            console.error("Failed to cancel booking:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "confirmed":
                return "bg-blue-100 text-blue-800";
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
                        <p className="text-gray-600 mt-2">View and manage all bookings</p>
                    </div>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <select
                            value={filters.status}
                            onChange={(e) => {
                                setFilters({ ...filters, status: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Booking Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select
                            value={filters.paymentStatus}
                            onChange={(e) => {
                                setFilters({ ...filters, paymentStatus: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Payment Status</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">Loading bookings...</div>
                    ) : bookings.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">No bookings found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Property</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Check-in</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Check-out</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nights</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Payment</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking._id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                                                {booking.listingId?.title ?? "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div>
                                                    <p className="font-semibold">{booking.customerId?.fullName ?? "N/A"}</p>
                                                    <p className="text-sm text-gray-500">{booking.customerId?.email ?? "N/A"}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(booking.checkInDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(booking.checkOutDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-gray-900">
                                                {booking.totalNights}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                NPR {booking.totalPrice.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}
                                                >
                                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.paymentStatus === "paid"
                                                        ? "bg-green-100 text-green-800"
                                                        : booking.paymentStatus === "unpaid"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-blue-100 text-blue-800"
                                                        }`}
                                                >
                                                    {booking.paymentStatus.charAt(0).toUpperCase() +
                                                        booking.paymentStatus.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm space-x-2">
                                                {booking.status === "pending" && (
                                                    <button
                                                        onClick={() => handleConfirm(booking._id)}
                                                        className="text-green-600 hover:text-green-800 font-semibold"
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                {booking.status !== "cancelled" && (
                                                    <button
                                                        onClick={() => handleCancel(booking._id)}
                                                        className="text-red-600 hover:text-red-800 font-semibold"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && bookings.length > 0 && (
                        <div className="px-6 py-4 border-t flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                Showing page {page} of {Math.ceil(total / limit)} ({total} total bookings)
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
