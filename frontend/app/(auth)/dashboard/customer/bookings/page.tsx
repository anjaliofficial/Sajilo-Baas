"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";

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

export default function CustomerBookingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(true);
    const [reviewedIds, setReviewedIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        console.log("🔍 [AUTH] Loading:", loading, "User:", user);

        if (loading) {
            console.log("🔍 [AUTH] Still loading auth...");
            return;
        }

        if (!user) {
            console.error("❌ [AUTH] No user found, redirecting to login");
            router.replace("/login");
            return;
        }

        console.log("🔍 [AUTH] User authenticated:", user.fullName, "Role:", user.role);

        if (user.role !== "customer") {
            console.error("❌ [AUTH] User role is not customer:", user.role);
            router.replace(getDashboardPath(user.role));
            return;
        }

        setReady(true);
        fetchBookings();
    }, [loading, user, router]);

    const fetchBookings = async () => {
        try {
            const url = `/api/bookings/customer/my`;
            console.log("🔍 [BOOKINGS] Fetching from:", url);

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            console.log("🔍 [BOOKINGS] Response status:", response.status);

            if (!response.ok) {
                console.error("❌ [BOOKINGS] Fetch response not ok:", response.status, response.statusText);
                const errorText = await response.text();
                console.error("❌ [BOOKINGS] Error response body:", errorText);
                throw new Error(`Failed to fetch bookings: ${response.status}`);
            }
            const data = await response.json();
            console.log("✅ [BOOKINGS] Success, received:", data.bookings?.length || 0, "bookings");
            setBookings(data.bookings || []);
            fetchReviewedBookings(data.bookings || []);
        } catch (error) {
            console.error("❌ [BOOKINGS] Error fetching bookings:", error);
        } finally {
            setBookingLoading(false);
        }
    };

    const fetchReviewedBookings = async (items: any[]) => {
        const bookingIds = items.map((booking) => booking._id).filter(Boolean);
        if (bookingIds.length === 0) {
            setReviewedIds({});
            return;
        }

        const params = new URLSearchParams();
        params.set("bookingIds", bookingIds.join(","));

        try {
            const url = `${API_BASE}/api/reviews/mine?${params.toString()}`;
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            if (!response.ok) return;
            const data = await response.json();
            const reviewedList = data.reviewedBookingIds || [];
            const reviewedMap = reviewedList.reduce((acc: Record<string, boolean>, id: string) => {
                acc[id] = true;
                return acc;
            }, {});
            setReviewedIds(reviewedMap);
        } catch (error) {
            console.error("Error fetching reviewed bookings:", error);
        }
    };

    const cancelBooking = async (bookingId: string) => {
        try {
            console.log("Cancelling booking:", bookingId);
            const url = `${API_BASE}/api/bookings/customer/${bookingId}/cancel`;
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            console.log("Cancel response status:", response.status);
            console.log("Cancel response headers:", response.headers.get("content-type"));

            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                let errorMessage = "Failed to cancel booking";

                try {
                    if (contentType && contentType.includes("application/json")) {
                        const errorData = await response.json();
                        console.error("Cancel error data:", errorData);
                        errorMessage = errorData.message || errorMessage;
                    } else {
                        const textError = await response.text();
                        console.error("Cancel error text:", textError);
                        errorMessage = textError || errorMessage;
                    }
                } catch (parseError) {
                    console.error("Error parsing response:", parseError);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log("Booking cancelled successfully:", data);
            fetchBookings();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert("Failed to cancel booking: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const getChatUrl = (booking: any) => {
        const hostId = booking.hostId?._id || booking.hostId;
        const params = new URLSearchParams();
        if (hostId) params.set("hostId", hostId);
        if (booking._id) params.set("bookingId", booking._id);
        if (booking.listingId?._id) params.set("listingId", booking.listingId._id);
        const query = params.toString();
        return query ? `/dashboard/customer/messages?${query}` : "/dashboard/customer/messages";
    };

    const getProfileUrl = (booking: any, includeReview: boolean) => {
        const hostId = booking.hostId?._id || booking.hostId;
        if (!hostId) return "/dashboard/customer/profile";
        const params = new URLSearchParams();
        if (includeReview && booking._id) params.set("bookingId", booking._id);
        if (booking.listingId?.title)
            params.set("listingTitle", booking.listingId.title);
        const query = params.toString();
        return query
            ? `/dashboard/customer/profile/${hostId}?${query}`
            : `/dashboard/customer/profile/${hostId}`;
    };

    const isReviewEligible = (booking: any) => {
        // Reviews can be added for any non-cancelled booking
        return booking.status !== "cancelled";
    };


    if (!ready || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
                    <p className="text-gray-600 text-lg">View and manage your reservations</p>
                </div>

                {bookingLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-12 text-center">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Yet</h3>
                            <p className="text-gray-600 mb-6">You haven't made any reservations yet. Start exploring!</p>
                            <a
                                href="/listings"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Browse Listings
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {bookings.map((booking: any) => {
                            const listingImages = booking.listingId?.images || [];
                            const listingTitle = booking.listingId?.title || "Property";

                            return (
                                <div
                                    key={booking._id}
                                    onClick={() => router.push(`/dashboard/customer/bookings/${booking._id}`)}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                                >
                                    <div className="flex flex-col md:flex-row">
                                        <div className="w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                                            {listingImages[0] ? (
                                                <img
                                                    src={toImageUrl(listingImages[0])}
                                                    alt={listingTitle}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{booking.listingId?.title || "Property"}</h3>
                                                    <p className="text-gray-600 flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        </svg>
                                                        {booking.listingId?.location || "Location"}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${booking.status === "confirmed" ? "bg-green-100 text-green-700" :
                                                    booking.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                                        booking.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                                    }`}>
                                                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Check-in</p>
                                                    <p className="font-semibold text-gray-900">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Check-out</p>
                                                    <p className="font-semibold text-gray-900">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-500">Total Price</p>
                                                    <p className="text-2xl font-bold text-gray-900">NPR {booking.totalPrice}</p>
                                                </div>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => router.push(getChatUrl(booking))}
                                                        className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-all"
                                                    >
                                                        Chat
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(getProfileUrl(booking, false))}
                                                        className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                                                    >
                                                        View Host
                                                    </button>
                                                    {reviewedIds[booking._id] ? (
                                                        <span className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-100 rounded-lg">
                                                            Reviewed
                                                        </span>
                                                    ) : isReviewEligible(booking) ? (
                                                        <button
                                                            onClick={() => router.push(getProfileUrl(booking, true))}
                                                            className="px-4 py-2 border-2 border-emerald-600 text-emerald-700 rounded-lg hover:bg-emerald-50 font-semibold transition-all"
                                                        >
                                                            Leave Review
                                                        </button>
                                                    ) : null}
                                                    {booking.status === "pending" ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                cancelBooking(booking._id);
                                                            }}
                                                            className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-all"
                                                        >
                                                            Cancel Booking
                                                        </button>
                                                    ) : booking.status === "confirmed" ? (
                                                        <div className="text-sm text-gray-500 italic">
                                                            Confirmed bookings cannot be cancelled
                                                        </div>
                                                    ) : booking.status === "cancelled" ? (
                                                        <div className="text-sm text-red-500 italic">
                                                            This booking was cancelled
                                                        </div>
                                                    ) : null}
                                                </div>
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
    );
}