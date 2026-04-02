"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getToken } from "@/lib/auth/storage";
import Link from "next/link";

interface Listing {
    _id: string;
    title: string;
    location: string;
    propertyType: string;
    status: string;
    hostId: { fullName: string; email: string };
    pricePerNight: number;
    createdAt: string;
}

export default function ListingsManagement() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        propertyType: "",
        search: "",
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
        fetchListings();
    }, [user, authLoading, router, filters, page]);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.propertyType) params.append("propertyType", filters.propertyType);
            if (filters.search) params.append("search", filters.search);
            params.append("page", String(page));
            params.append("limit", String(limit));

            const token = getToken();
            const response = await fetch(`/api/admin/listings?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                setListings(data.listings);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch listings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (listingId: string) => {
        try {
            const token = getToken();
            const response = await fetch(`/api/admin/listings?action=approve&id=${listingId}`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                fetchListings();
            }
        } catch (error) {
            console.error("Failed to approve listing:", error);
        }
    };

    const handleReject = async (listingId: string) => {
        const reason = prompt("Enter reason for rejection:");
        if (!reason) return;

        try {
            const token = getToken();
            const response = await fetch(`/api/admin/listings?action=reject&id=${listingId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ reason }),
            });
            const data = await response.json();
            if (data.success) {
                fetchListings();
            }
        } catch (error) {
            console.error("Failed to reject listing:", error);
        }
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            const token = getToken();
            const response = await fetch(`/api/admin/listings?id=${listingId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                fetchListings();
            }
        } catch (error) {
            console.error("Failed to delete listing:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Listing Management</h1>
                        <p className="text-gray-600 mt-2">Approve, reject, or monitor property listings</p>
                    </div>
                    <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search by title or location..."
                            value={filters.search}
                            onChange={(e) => {
                                setFilters({ ...filters, search: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={filters.propertyType}
                            onChange={(e) => {
                                setFilters({ ...filters, propertyType: e.target.value });
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="room">Room</option>
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="homestay">Homestay</option>
                        </select>
                    </div>
                </div>

                {/* Listings Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">Loading listings...</div>
                    ) : listings.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">No listings found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Host</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price/Night</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map((listing) => (
                                        <tr key={listing._id} className="border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                                                {listing.title ?? "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{listing.location ?? "N/A"}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold capitalize">
                                                    {listing.propertyType ?? "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div>
                                                    <p className="font-medium">{listing.hostId?.fullName ?? "N/A"}</p>
                                                    <p className="text-sm text-gray-500">{listing.hostId?.email ?? "N/A"}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                NPR {listing.pricePerNight}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${listing.status === "approved"
                                                        ? "bg-green-100 text-green-800"
                                                        : listing.status === "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(listing.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm space-x-2">
                                                {listing.status === "pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(listing._id)}
                                                            className="text-green-600 hover:text-green-800 font-semibold"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(listing._id)}
                                                            className="text-red-600 hover:text-red-800 font-semibold"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(listing._id)}
                                                    className="text-red-600 hover:text-red-800 font-semibold"
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
                    {!loading && listings.length > 0 && (
                        <div className="px-6 py-4 border-t flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                                Showing page {page} of {Math.ceil(total / limit)} ({total} total listings)
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
