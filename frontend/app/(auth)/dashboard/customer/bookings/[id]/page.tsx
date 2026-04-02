"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/app/(public)/listings/MapComponent"), { ssr: false });

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

export default function BookingDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const bookingId = params?.id as string | undefined;

    const [ready, setReady] = useState(false);
    const [booking, setBooking] = useState<any | null>(null);
    const [bookingLoading, setBookingLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "customer") {
            router.replace(getDashboardPath(user.role));
            return;
        }

        setReady(true);
        if (bookingId) {
            fetchBookingDetails();
        }
    }, [loading, user, router, bookingId]);

    const fetchBookingDetails = async () => {
        if (!bookingId) return;

        try {
            setBookingLoading(true);
            setError("");
            const url = `/api/bookings/customer/${bookingId}`;
            console.log("Fetching booking details from:", url);
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            if (!response.ok) {
                console.error("Failed to fetch booking, status:", response.status);
                if (response.status === 404) {
                    setError("Booking not found");
                } else if (response.status === 403) {
                    setError("You don't have access to this booking");
                } else {
                    setError("Failed to load booking details");
                }
                setBooking(null);
                return;
            }

            const data = await response.json();
            setBooking(data.booking || null);
        } catch (err) {
            console.error("Error fetching booking:", err);
            setError("Error loading booking details");
            setBooking(null);
        } finally {
            setBookingLoading(false);
        }
    };

    const cancelBooking = async () => {
        if (!booking) return;

        if (
            !confirm(
                "Are you sure you want to cancel this booking? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            const url = `/api/bookings/customer/${booking._id}/cancel`;
            console.log("Cancelling booking at:", url);
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });

            if (!response.ok) {
                let errorMsg = "Unknown error";
                try {
                    const data = await response.json();
                    errorMsg = data.message || errorMsg;
                } catch (e) {
                    errorMsg = "Failed to cancel booking";
                }
                alert("Failed to cancel booking: " + errorMsg);
                return;
            }

            alert("Booking cancelled successfully");
            await fetchBookingDetails();
        } catch (err) {
            console.error("Error cancelling booking:", err);
            alert("Error cancelling booking");
        }
    };

    const downloadReceipt = () => {
        if (!booking) return;

        // Create a simple receipt document
        const receiptContent = `
BOOKING RECEIPT
===============================================

Booking ID: ${booking._id}
Date: ${new Date(booking.createdAt).toLocaleDateString()}

LISTING DETAILS
===============================================
Property: ${booking.listingId?.title || "N/A"}
Location: ${booking.listingId?.location || "N/A"}
Host: ${booking.hostId?.fullName || "N/A"}

BOOKING DATES
===============================================
Check-in:  ${new Date(booking.checkInDate).toLocaleDateString()}
Check-out: ${new Date(booking.checkOutDate).toLocaleDateString()}
Nights: ${Math.ceil(
            (new Date(booking.checkOutDate).getTime() -
                new Date(booking.checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )}

PAYMENT SUMMARY
===============================================
Rate per Night: NPR ${booking.pricePerNight || "N/A"}
Number of Nights: ${Math.ceil(
            (new Date(booking.checkOutDate).getTime() -
                new Date(booking.checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )}
Total Amount: NPR ${booking.totalPrice}
Payment Status: ${booking.paymentStatus?.toUpperCase() || "N/A"}

BOOKING STATUS
===============================================
Status: ${booking.status?.toUpperCase() || "N/A"}

===============================================
Thank you for your booking!
        `;

        // Create blob and download
        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(receiptContent)
        );
        element.setAttribute("download", `receipt_${booking._id}.txt`);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
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

    if (bookingLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-lg">Loading booking...</p>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="max-w-7xl mx-auto py-10">
                <Link href="/dashboard/customer/bookings" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Bookings
                </Link>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <p className="text-red-700 text-lg font-semibold">{error || "Booking not found"}</p>
                </div>
            </div>
        );
    }

    const listingImages = booking.listingId?.images || [];
    const latitude = booking.listingId?.coordinates?.coordinates?.[1];
    const longitude = booking.listingId?.coordinates?.coordinates?.[0];

    const nightsCount = Math.ceil(
        (new Date(booking.checkOutDate).getTime() -
            new Date(booking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Back Button */}
            <Link href="/dashboard/customer/bookings" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Bookings
            </Link>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-4xl font-bold text-gray-900">Booking Details</h1>
                    <span className={`px-4 py-2 text-sm font-semibold rounded-full ${booking.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : booking.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                    </span>
                </div>
                <p className="text-gray-600 text-lg">Booking ID: #{booking._id?.slice(-8)}</p>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column - Listing & Dates */}
                <div className="md:col-span-2 space-y-6">
                    {/* Listing Section */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 p-6 pb-4">Listing Information</h2>

                        {/* Images */}
                        {listingImages.length > 0 && (
                            <div className="relative w-full h-96">
                                <img
                                    src={toImageUrl(listingImages[0])}
                                    alt={booking.listingId?.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-gray-500 text-sm uppercase font-semibold mb-1">Property Name</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {booking.listingId?.title || "N/A"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500 text-sm uppercase font-semibold mb-1">Location</p>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <p className="text-gray-900">{booking.listingId?.location || "N/A"}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-500 text-sm uppercase font-semibold mb-1">Host</p>
                                <p className="text-gray-900 font-semibold">{booking.hostId?.fullName || "N/A"}</p>
                                <p className="text-gray-600 text-sm">{booking.hostId?.email || ""}</p>
                            </div>
                        </div>
                    </div>

                    {/* Map Section */}
                    {latitude && longitude && (
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 p-6 pb-4">Location Map</h2>
                            <div className="px-6 pb-6">
                                <MapComponent lat={latitude} lng={longitude} title={booking.listingId?.title} />
                            </div>
                        </div>
                    )}

                    {/* Booking Dates Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Dates</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-gray-500 text-sm uppercase font-semibold mb-2">Check-in</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {new Date(booking.checkInDate).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="text-gray-600 text-sm mt-1">
                                    {new Date(booking.checkInDate).toLocaleDateString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm uppercase font-semibold mb-2">Check-out</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {new Date(booking.checkOutDate).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="text-gray-600 text-sm mt-1">
                                    {new Date(booking.checkOutDate).toLocaleDateString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">{nightsCount}</span> night{nightsCount !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Summary */}
                <div className="md:col-span-1 space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Summary</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                    NPR {booking.pricePerNight || "N/A"} × {nightsCount} night{nightsCount !== 1 ? "s" : ""}
                                </span>
                                <span className="font-semibold text-gray-900">
                                    NPR {(booking.pricePerNight || 0) * nightsCount}
                                </span>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900">Total</span>
                                    <span className="text-3xl font-bold text-blue-600">NPR {booking.totalPrice}</span>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500 mb-2">Payment Status</p>
                                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${booking.paymentStatus === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : booking.paymentStatus === "pending"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}>
                                    {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1) || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions</h2>
                        <div className="space-y-3">
                            <Link
                                href={`/dashboard/customer/messages?hostId=${booking.hostId?._id || booking.hostId}&bookingId=${booking._id}`}
                                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-center transition-colors"
                            >
                                Contact Host
                            </Link>
                            <button
                                onClick={downloadReceipt}
                                className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                            >
                                Download Receipt
                            </button>
                            {booking.status === "pending" ? (
                                <button
                                    onClick={cancelBooking}
                                    className="w-full px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors"
                                >
                                    Cancel Booking
                                </button>
                            ) : booking.status === "confirmed" ? (
                                <div className="text-sm text-gray-500 italic p-2 text-center">
                                    Confirmed bookings cannot be cancelled
                                </div>
                            ) : booking.status === "cancelled" ? (
                                <div className="text-sm text-red-500 italic p-2 text-center">
                                    This booking was cancelled
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Booking Info */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Info</h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Booking Created</p>
                                <p className="text-gray-900 font-semibold">
                                    {new Date(booking.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Booking ID</p>
                                <p className="text-gray-900 font-mono text-xs">{booking._id}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
