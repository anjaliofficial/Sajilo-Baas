"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import HostFooter from "../_components/HostFooter";

export default function HostDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [listings, setListings] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [ready, setReady] = useState(false);

    // Check auth and role on mount
    useEffect(() => {
        if (!loading && user?.role !== "host") {
            const dashPath = user?.role === "customer" ? "/dashboard/customer" : "/";
            router.push(dashPath);
            return;
        }
        setReady(true);
    }, [loading, user, router]);

    // Fetch listings count and calculate rating
    useEffect(() => {
        if (!ready) return;
        void fetchListingsCount();
        void fetchBookings();
    }, [ready]);

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/bookings/host", {
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok && data.bookings) {
                setBookings(data.bookings);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    const fetchListingsCount = async () => {
        try {
            const res = await fetch("/api/listings/my");
            const data = await res.json();
            if (res.ok) {
                const listingsData = data.listings || [];
                setListings(listingsData);

                // Calculate average rating from all listings
                if (listingsData.length > 0) {
                    const totalRating = listingsData.reduce((sum: number, listing: any) => {
                        return sum + (listing.rating || listing.avgRating || 0);
                    }, 0);
                    const avg = totalRating / listingsData.length;
                    setAvgRating(Math.round(avg * 10) / 10); // Round to 1 decimal place
                } else {
                    setAvgRating(0);
                }
            }
        } catch {
            setAvgRating(0);
        }
    };

    // Calculate active bookings (confirmed or pending)
    const activeBookingsCount = bookings.filter(
        (b) => b.status === "confirmed" || b.status === "pending"
    ).length;

    // Calculate total revenue from confirmed bookings
    const totalRevenue = bookings
        .filter((b) => b.status === "confirmed")
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const bookingChannels = [
        { name: "Direct", value: 52 },
        { name: "Referral", value: 31 },
        { name: "Repeat Guests", value: 67 },
    ];

    if (!ready || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-lg">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Welcome Header with Gradient Background */}
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-xl p-4 mb-5 text-white relative overflow-hidden w-full">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                                    Welcome back, {user.fullName?.split(' ')[0]}! 👋
                                </h1>
                                <p className="text-blue-100 text-sm">Manage your properties and grow your business</p>
                            </div>
                            <Link
                                href="/dashboard/host/messages"
                                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                Open Chat
                            </Link>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5 w-full">
                    <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Listings</p>
                        <p className="text-xl font-bold text-gray-900">{listings.length}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-sky-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Active Bookings</p>
                        <p className="text-xl font-bold text-gray-900">{activeBookingsCount}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Revenue</p>
                        <p className="text-xl font-bold text-gray-900">NPR {totalRevenue.toLocaleString("en-NP")}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-3 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Avg Rating</p>
                        <p className="text-xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className="mb-6 w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Create New Listing Card */}
                        <Link href="/dashboard/host/create-listing" className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-3 text-white overflow-hidden hover:shadow-lg transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-bold mb-0.5">Create New Listing</h3>
                                <p className="text-blue-100 text-xs">Add a new property to your portfolio</p>
                            </div>
                        </Link>

                        {/* My Listings Card */}
                        <Link href="/dashboard/host/listings" className="group relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md p-3 text-white overflow-hidden hover:shadow-lg transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                            <div className="relative z-10">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <h3 className="text-sm font-bold mb-0.5">My Listings ({listings.length})</h3>
                                <p className="text-blue-100 text-xs">View and manage all your properties</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Management Tools */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 w-full">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <h2 className="text-lg font-bold text-white">Management Tools</h2>
                    </div>

                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Link href="/dashboard/host/bookings" className="group p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-all">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1 text-sm">Bookings</h3>
                            <p className="text-xs text-gray-600">Manage reservations</p>
                        </Link>

                        <Link href="/dashboard/host" className="group p-3 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-all">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1 text-sm">Analytics</h3>
                            <p className="text-xs text-gray-600">View statistics</p>
                        </Link>

                        <Link href="/dashboard/host/reviews" className="group p-3 rounded-lg border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-indigo-200 transition-all">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1 text-sm">Reviews</h3>
                            <p className="text-xs text-gray-600">View ratings</p>
                        </Link>

                        <Link href="/dashboard/host/profile" className="group p-3 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-orange-200 transition-all">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1 text-sm">Settings</h3>
                            <p className="text-xs text-gray-600">Account options</p>
                        </Link>
                    </div>
                </div>

                {/* Analytics Overview (Dummy Charts) */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 w-full">
                    <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 14l3-3 3 2 4-5" />
                        </svg>
                        <h2 className="text-lg font-bold text-gray-900">Analytics Overview</h2>
                    </div>

                    <div className="p-4">
                        <div className="rounded-lg border border-gray-200 p-4">
                            <p className="text-sm font-semibold text-gray-800 mb-3">Booking Sources</p>
                            <div className="space-y-3">
                                {bookingChannels.map((channel) => (
                                    <div key={channel.name}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-600">{channel.name}</span>
                                            <span className="text-xs font-semibold text-gray-800">{channel.value}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                                                style={{ width: `${channel.value}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <HostFooter />
        </>
    );
}
