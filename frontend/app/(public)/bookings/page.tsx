"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Booking {
    _id: string;
    listingId: { _id: string; title: string; location: string; images: string[] };
    hostId: { fullName: string; phoneNumber: string };
    checkInDate: string;
    checkOutDate: string;
    totalPrice: number;
    totalNights: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
}

const RAW_API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
    ? RAW_API_BASE.slice(0, -4)
    : RAW_API_BASE;

const toImageUrl = (path?: string) => {
    if (!path) return "";
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    const cleaned = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE}${cleaned}`;
};

export default function BookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        fetchBookings();
    }, [filter]);

    const fetchBookings = async () => {
        setLoading(true);
        setError("");

        try {
            const url = `/api/bookings/my${filter !== "all" ? `?status=${filter}` : ""}`;
            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok) {
                setError(data?.message || "Failed to load bookings");
                setBookings([]);
                return;
            }

            setBookings(data.bookings || []);
        } catch (err) {
            setError("Failed to load bookings");
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        try {
            const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
                method: "POST",
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data?.message || "Failed to cancel booking");
                return;
            }

            alert("Booking cancelled successfully");
            await fetchBookings();
        } catch (err) {
            alert("Failed to cancel booking");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "confirmed":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200";
            case "completed":
                return "bg-blue-50 text-blue-700 border-blue-200";
            default:
                return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-[#1a3a4a] text-white py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <h1 className="text-4xl font-bold">My Bookings</h1>
                    <p className="text-sky-100 mt-2">
                        View and manage your reservations
                    </p>
                </div>
            </header>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-6 py-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-8 h-fit">
                            <h2 className="text-2xl font-bold text-[#1a3a4a] mb-2">
                                Bookings
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-8">
                                Manage your reservations
                            </p>

                            {/* Quick Stats */}
                            <div className="space-y-3 border-t border-slate-100 pt-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Total Bookings</span>
                                    <span className="font-bold text-[#1a3a4a]">{bookings.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Pending</span>
                                    <span className="font-semibold text-yellow-600">
                                        {bookings.filter((b) => b.status === "pending").length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Confirmed</span>
                                    <span className="font-semibold text-emerald-600">
                                        {bookings.filter((b) => b.status === "confirmed").length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Completed</span>
                                    <span className="font-semibold text-blue-600">
                                        {bookings.filter((b) => b.status === "completed").length}
                                    </span>
                                </div>
                            </div>

                            {/* Help Section */}
                            <div className="border-t border-slate-100 pt-6 mt-6">
                                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                                    Need Help?
                                </p>
                                <Link
                                    href="/listings"
                                    className="inline-block w-full text-center bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
                                >
                                    Browse More Listings
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-6 flex-wrap">
                            {["all", "pending", "confirmed", "completed", "cancelled"].map(
                                (status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilter(status)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition capitalize ${filter === status
                                            ? "bg-[#1a3a4a] text-white"
                                            : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                                            }`}
                                    >
                                        {status === "all" ? "All Bookings" : status}
                                    </button>
                                )
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-12 text-slate-500">
                                Loading bookings...
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-600 mb-4">
                                    {filter === "all"
                                        ? "No bookings yet"
                                        : `No ${filter} bookings`}
                                </p>
                                <Link
                                    href="/listings"
                                    className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700"
                                >
                                    Browse Listings
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {bookings.map((booking) => {
                                    // Safely access nested properties with fallbacks
                                    const listing = booking.listingId || {};
                                    const listingImages = listing.images || [];
                                    const listingTitle = listing.title || "Listing";
                                    const listingLocation = listing.location || "Location not available";
                                    const listingId = listing._id || "";
                                    const hostName = booking.hostId?.fullName || "Host";

                                    return (
                                        <div
                                            key={booking._id}
                                            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition"
                                        >
                                            <div className="grid md:grid-cols-[200px_1fr_200px] gap-6 p-6">
                                                {/* Image */}
                                                <div className="flex-shrink-0">
                                                    {listingImages[0] ? (
                                                        <img
                                                            src={toImageUrl(listingImages[0])}
                                                            alt={listingTitle}
                                                            className="h-40 w-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="h-40 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                                            No image
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="space-y-3">
                                                    {listingId ? (
                                                        <Link
                                                            href={`/listings/${listingId}`}
                                                            className="text-lg font-semibold text-[#1a3a4a] hover:text-emerald-600 line-clamp-2"
                                                        >
                                                            {listingTitle}
                                                        </Link>
                                                    ) : (
                                                        <h3 className="text-lg font-semibold text-[#1a3a4a] line-clamp-2">
                                                            {listingTitle}
                                                        </h3>
                                                    )}
                                                    <p className="text-sm text-slate-600">
                                                        {listingLocation}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-slate-500">Check-in</p>
                                                            <p className="font-semibold">
                                                                {new Date(booking.checkInDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-500">Check-out</p>
                                                            <p className="font-semibold">
                                                                {new Date(booking.checkOutDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-slate-600">
                                                            Host: <span className="font-semibold">{hostName}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status & Price */}
                                                <div className="space-y-3 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex gap-2 mb-2 flex-wrap">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize ${getStatusColor(
                                                                    booking.status
                                                                )}`}
                                                            >
                                                                {booking.status}
                                                            </span>
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize ${booking.paymentStatus === "paid"
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                                    }`}
                                                            >
                                                                {booking.paymentStatus}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-sm text-slate-600 mb-1">
                                                            {booking.totalNights} night{booking.totalNights > 1 ? "s" : ""}
                                                        </p>
                                                        <p className="text-2xl font-bold text-[#1a3a4a]">
                                                            NPR {booking.totalPrice}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {booking.status === "pending" && (
                                                            <button
                                                                onClick={() => handleCancelBooking(booking._id.toString())}
                                                                className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition"
                                                            >
                                                                Cancel Booking
                                                            </button>
                                                        )}
                                                        {listingId && (
                                                            <button
                                                                onClick={() => router.push(`/listings/${listingId}`)}
                                                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                                                            >
                                                                View Listing
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
