"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";
import Link from "next/link";

export default function HostDashboard() {
    const { user, loading } = useAuth();
    const [ready, setReady] = useState(false);
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
    }, [loading, user, router]);

    if (!ready || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <div className="mb-12">
                <h1 className="text-5xl font-bold text-gray-900 mb-2">Welcome, {user.fullName}!</h1>
                <p className="text-gray-600 text-lg">Manage your listings and bookings from here</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500">
                    <p className="text-gray-600 text-sm font-medium mb-1">Total Listings</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                    <p className="text-gray-600 text-sm font-medium mb-1">Active Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">NPR 0</p>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                    <p className="text-gray-600 text-sm font-medium mb-1">Rating</p>
                    <p className="text-3xl font-bold text-gray-900">⭐ 5.0</p>
                </div>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Create New Listing Card */}
                <Link
                    href="/dashboard/host/create-listing"
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-shadow group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <svg className="w-6 h-6 text-white/50 group-hover:text-white/70 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Create New Listing</h2>
                    <p className="text-emerald-100">Add a new property to your portfolio and start receiving bookings</p>
                </Link>

                {/* View Listings Card */}
                <Link
                    href="/dashboard/host/listings"
                    className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl hover:border-emerald-300 transition-all group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition">
                            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">My Listings</h2>
                    <p className="text-gray-600">View and manage all your properties</p>
                </Link>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Links</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href="/dashboard/host/bookings"
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition text-center"
                    >
                        <svg className="w-6 h-6 text-emerald-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-900">Bookings</p>
                    </Link>
                    <Link
                        href="/dashboard/host/reviews"
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition text-center"
                    >
                        <svg className="w-6 h-6 text-yellow-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-900">Reviews</p>
                    </Link>
                    <Link
                        href="/dashboard/host/profile"
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition text-center"
                    >
                        <svg className="w-6 h-6 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-900">Profile</p>
                    </Link>
                    <Link
                        href="/"
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition text-center"
                    >
                        <svg className="w-6 h-6 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-900">Back to Home</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
