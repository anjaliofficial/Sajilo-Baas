"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";

// Get proper API base URL for images (without /api suffix)
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const API_BASE = RAW_API_BASE.endsWith("/api")
    ? RAW_API_BASE.slice(0, -4)
    : RAW_API_BASE;

// Normalize image URLs to point to backend
const normalizeImageUrl = (url: string): string => {
    if (!url) return "";

    const normalized = url.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;

    // If already has /uploads/, use as-is
    if (normalized.startsWith("/uploads/")) {
        return `${API_BASE}${normalized}`;
    }

    // Extract just filename and add /uploads/ prefix
    const filename = normalized.split("/").pop() || normalized;
    return `${API_BASE}/uploads/${filename}`;
};

export default function HostListingsPage() {
    const { user, loading } = useAuth();
    const [ready, setReady] = useState(false);
    const [listings, setListings] = useState([]);
    const [listingLoading, setListingLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "host") {
            router.replace(getDashboardPath(user.role));
            return;
        }

        setReady(true);
        fetchListings();
    }, [loading, user, router]);

    const fetchListings = async () => {
        try {
            const response = await fetch("/api/listings/my");

            if (!response.ok) throw new Error("Failed to fetch listings");
            const data = await response.json();
            console.log("Listings API Response:", data);
            if (data.listings) {
                data.listings.forEach((listing: any, idx: number) => {
                    console.log(`Listing ${idx} (${listing.title}):`, {
                        images: listing.images,
                        imageCount: listing.images?.length || 0,
                    });
                });
            }
            setListings(data.listings || []);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setListingLoading(false);
        }
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto p-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Listings</h1>
                        <p className="text-gray-600 text-lg">Manage your properties</p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/host/listings/new")}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Listing
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">

                {listingLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-2xl mx-auto">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 0118 0 9 9 0 01-18 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-3">No Listings Yet</h3>
                        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                            Start building your portfolio by creating your first property listing. Add beautiful images, set your price, and start receiving bookings today!
                        </p>
                        <button
                            onClick={() => router.push("/dashboard/host/listings/new")}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First Listing
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing: any) => (
                            <div key={listing._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="w-full h-56 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden relative">
                                    {listing.images && listing.images.length > 0 ? (
                                        <img
                                            src={normalizeImageUrl(listing.images[0])}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error(`Failed to load image: ${listing.images[0]}`);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                    {listing.images && listing.images.length > 1 && (
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                                            +{listing.images.length - 1} more
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1.5">{listing.title}</h3>
                                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                                    <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-4">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        {listing.location}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                        <span className="text-lg font-bold text-gray-900">NPR {listing.pricePerNight}/night</span>
                                        <div className="flex gap-2">
                                            <a
                                                href={`/dashboard/host/listings/${listing._id}`}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                                            >
                                                Edit
                                            </a>
                                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
