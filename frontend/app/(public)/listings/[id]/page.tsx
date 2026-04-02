"use client";

import { useEffect, useMemo, useState } from "react";
import Toast from "../Toast";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const ListingDistanceMap = dynamic(() => import("../ListingDistanceMap"), { ssr: false });

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

interface BookingFormData {
    checkInDate: string;
    checkOutDate: string;
}

export default function ListingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const listingId = params?.id as string | undefined;

    const [listing, setListing] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dates, setDates] = useState({
        availableFrom: "",
        availableTo: "",
    });
    const [availability, setAvailability] = useState<boolean | null>(null);

    // Booking form state
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [bookingData, setBookingData] = useState<BookingFormData>({
        checkInDate: "",
        checkOutDate: "",
    });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [toast, setToast] = useState<{ message: string; type?: "success" | "error" | "info" } | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (dates.availableFrom) params.set("availableFrom", dates.availableFrom);
        if (dates.availableTo) params.set("availableTo", dates.availableTo);
        return params.toString();
    }, [dates]);

    const fetchListing = async () => {
        if (!listingId) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch(
                `/api/listings/${listingId}${queryString ? `?${queryString}` : ""}`,
            );
            const data = await res.json();
            if (!res.ok) {
                setError(data?.message || "Failed to load listing");
                setListing(null);
                setAvailability(null);
                return;
            }

            setListing(data.listing || null);
            setAvailability(
                typeof data.isAvailable === "boolean" ? data.isAvailable : null,
            );
        } catch {
            setError("Failed to load listing");
            setListing(null);
            setAvailability(null);
        } finally {
            setLoading(false);
        }
    };

    // Check availability with backend when booking dates change
    useEffect(() => {
        const checkAvailability = async () => {
            if (!listingId || !bookingData.checkInDate || !bookingData.checkOutDate) {
                setAvailability(null);
                return;
            }
            try {
                const params = new URLSearchParams({
                    listingId,
                    checkInDate: bookingData.checkInDate,
                    checkOutDate: bookingData.checkOutDate,
                });
                const res = await fetch(`/api/bookings/customer/availability?${params.toString()}`);
                const data = await res.json();
                setAvailability(data?.isAvailable ?? null);
            } catch {
                setAvailability(null);
            }
        };
        checkAvailability();
    }, [listingId, bookingData.checkInDate, bookingData.checkOutDate]);

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookingError("");
        setBookingSuccess(false);

        if (!bookingData.checkInDate || !bookingData.checkOutDate) {
            setToast({ message: "Please select both check-in and check-out dates", type: "info" });
            return;
        }

        setBookingLoading(true);

        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    listingId,
                    checkInDate: bookingData.checkInDate,
                    checkOutDate: bookingData.checkOutDate,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                let customMessage = data?.message || "Booking failed";
                if (data?.message?.toLowerCase().includes("minimum stay")) {
                    customMessage = `You must book at least ${listing.minStay || 1} nights for this listing.`;
                } else if (data?.message?.toLowerCase().includes("not available")) {
                    customMessage = "The selected dates are not available. Please choose different dates.";
                }
                setToast({ message: customMessage, type: "info" });
                return;
            }

            setBookingSuccess(true);
            setShowBookingForm(false);
            setBookingData({ checkInDate: "", checkOutDate: "" });

            // Redirect to booking confirmation or my bookings page
            setTimeout(() => {
                router.push("/bookings");
            }, 2000);
        } catch (err) {
            setToast({ message: "Failed to create booking", type: "error" });
        } finally {
            setBookingLoading(false);
        }
    };

    useEffect(() => {
        void fetchListing();
    }, [listingId, queryString]);

    if (loading && !listing) {
        return <div className="p-8 text-slate-500">Loading listing...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-red-600">
                {error} <Link href="/listings" className="underline">Back to listings</Link>
            </div>
        );
    }

    if (!listing) return null;

    const images = Array.isArray(listing.images) ? listing.images : [];
    const host = listing.hostId || {};
    const locationDetails = listing.locationDetails || {};

    const latitude =
        typeof listing.latitude === "number"
            ? listing.latitude
            : listing.coordinates?.coordinates?.[1];
    const longitude =
        typeof listing.longitude === "number"
            ? listing.longitude
            : listing.coordinates?.coordinates?.[0];

    // Calculate total for booking
    let totalNights = 0;
    let totalPrice = 0;
    if (bookingData.checkInDate && bookingData.checkOutDate) {
        const checkIn = new Date(bookingData.checkInDate);
        const checkOut = new Date(bookingData.checkOutDate);
        totalNights = Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000)
        );
        totalPrice = totalNights * listing.pricePerNight;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-[#1a3a4a] text-white">
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <Link href="/listings" className="text-sm text-sky-200">← Back to listings</Link>
                    <h1 className="text-4xl font-bold mt-3">{listing.title}</h1>
                    <p className="text-sky-100 mt-2">{listing.location}</p>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {images.length ? (
                            <img
                                src={toImageUrl(images[0])}
                                alt={listing.title}
                                className="h-72 w-full object-cover"
                            />
                        ) : (
                            <div className="h-72 flex items-center justify-center text-slate-400">
                                No image
                            </div>
                        )}
                        {images.length > 1 && (
                            <div className="grid grid-cols-3 gap-2 p-4">
                                {images.slice(1, 4).map((img: string) => (
                                    <img
                                        key={img}
                                        src={toImageUrl(img)}
                                        alt="Listing"
                                        className="h-20 w-full object-cover rounded-lg"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</p>
                            <p className="text-3xl font-bold text-[#1a3a4a]">NPR {listing.pricePerNight}</p>
                            <p className="text-sm text-slate-500">Per night</p>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            <div>Property type: {listing.propertyType || "room"}</div>
                            <div>Max guests: {listing.maxGuests || 1}</div>
                            <div>Min stay: {listing.minStay || 1} nights</div>
                            <div>Cancellation: {listing.cancellationPolicy}</div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Check availability</p>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                    value={dates.availableFrom}
                                    onChange={(event) =>
                                        setDates({ ...dates, availableFrom: event.target.value })
                                    }
                                />
                                <input
                                    type="date"
                                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                    value={dates.availableTo}
                                    onChange={(event) =>
                                        setDates({ ...dates, availableTo: event.target.value })
                                    }
                                />
                            </div>
                            {availability !== null && (
                                <p
                                    className={`text-sm font-semibold ${availability ? "text-emerald-600" : "text-red-600"
                                        }`}
                                >
                                    {availability ? "✓ Available for selected dates" : "✗ Not available"}
                                </p>
                            )}
                        </div>

                        <>
                            <button
                                onClick={() => setShowBookingForm(true)}
                                className={`w-full font-semibold py-3 rounded-lg transition ${availability === false ? "bg-gray-300 text-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                                disabled={availability !== true}
                            >
                                Reserve Now
                            </button>
                            {/* Inline Toast below button, red line style */}
                            {toast && toast.type !== "success" && (
                                <div className="w-full mt-2">
                                    <div className="w-full border-l-4 border-red-600 bg-red-50 text-red-700 px-4 py-2 rounded text-sm flex items-center">
                                        <span className="flex-1">{toast.message}</span>
                                        <button
                                            className="ml-2 text-red-700 font-bold"
                                            onClick={() => setToast(null)}
                                            aria-label="Close notification"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    </aside>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900">About this stay</h2>
                    <p className="text-slate-600 leading-relaxed">{listing.description}</p>
                    <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-600">
                        <div>
                            <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">Amenities</p>
                            <p>{(listing.amenities || []).join(", ") || "No amenities listed"}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">House rules</p>
                            <p>{listing.houseRules || "No special rules provided."}</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900">Location</h2>
                    <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                        <div>
                            <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">City</p>
                            <p>{locationDetails.city || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">Neighborhood</p>
                            <p>{locationDetails.neighborhood || "N/A"}</p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-slate-500 uppercase text-xs tracking-[0.2em]">Full Address</p>
                            <p>{locationDetails.fullAddress || listing.location || "N/A"}</p>
                        </div>
                    </div>
                    {typeof latitude === "number" && typeof longitude === "number" && (
                        <ListingDistanceMap
                            listingLat={latitude}
                            listingLng={longitude}
                            listingTitle={listing.title}
                        />
                    )}
                </section>

                <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900">Host details</h2>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-lg font-semibold text-slate-900">{host.fullName || "Host"}</p>
                            <p className="text-sm text-slate-600">{host.address || ""}</p>
                        </div>
                        <div className="text-sm text-slate-600">
                            <p>Phone: {host.phoneNumber || "N/A"}</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Booking Form Modal */}
            {showBookingForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Complete your booking</h2>
                            <p className="text-slate-600">{listing.title}</p>
                        </div>

                        {bookingSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700">
                                ✓ Booking created successfully! Redirecting...
                            </div>
                        )}

                        {bookingError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                                {bookingError}
                            </div>
                        )}

                        <form onSubmit={handleBooking} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Check-in Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={bookingData.checkInDate}
                                    onChange={(e) =>
                                        setBookingData({ ...bookingData, checkInDate: e.target.value })
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Check-out Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={bookingData.checkOutDate}
                                    onChange={(e) =>
                                        setBookingData({ ...bookingData, checkOutDate: e.target.value })
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                                />
                            </div>

                            {totalNights > 0 && (
                                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-slate-700">
                                        <span>NPR {listing.pricePerNight} × {totalNights} nights</span>
                                        <span className="font-semibold">NPR {totalPrice}</span>
                                    </div>
                                </div>
                            )}
                            {/* Minimum stay requirement highlight */}
                            <div className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Minimum stay: {listing.minStay || 1} nights
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingForm(false)}
                                    disabled={bookingLoading}
                                    className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bookingLoading}
                                    className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {bookingLoading ? "Booking..." : "Confirm Booking"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Toast Notification (global, fallback for other errors) */}
            {toast && !availability && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
