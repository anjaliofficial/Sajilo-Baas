"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";

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
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/listings/my`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (!response.ok) throw new Error("Failed to fetch listings");
            const data = await response.json();
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
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My Listings</h1>
                    <p className="text-gray-600 text-lg">Manage your properties</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/host/messages"
                        className="px-4 py-3 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-semibold shadow-sm"
                    >
                        Open Chat
                    </Link>
                    <a
                        href="/dashboard/host/listings/create"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg"
                    >
                        + Create Listing
                    </a>
                </div>
            </div>

            {listingLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : listings.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Listings Yet</h3>
                    <p className="text-gray-600 mb-6">Create your first property listing to start receiving bookings</p>
                    <a
                        href="/dashboard/host/listings/create"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
                    >
                        Create First Listing
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing: any) => (
                        <div key={listing._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                            <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{listing.title}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{listing.description}</p>
                                <div className="flex items-center gap-1 text-gray-600 text-sm mb-4">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    {listing.location}
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                    <span className="text-lg font-bold text-gray-900">NPR {listing.price}/night</span>
                                    <div className="flex gap-2">
                                        <a
                                            href={`/dashboard/host/listings/${listing._id}`}
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                                        >
                                            Edit
                                        </a>
                                        <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm">
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
    );
}