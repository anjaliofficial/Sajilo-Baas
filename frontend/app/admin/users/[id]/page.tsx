"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getToken } from "@/lib/auth/storage";
import Link from "next/link";

interface User {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    role: string;
    status: string;
    profilePicture: string;
    createdAt: string;
}

export default function UserDetail() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            router.push("/login");
            return;
        }
        fetchUser();
    }, [user, authLoading, router, userId]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`/api/admin/users/${userId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            const data = await response.json();
            if (data.success) {
                setUserData(data.user);
            } else {
                setError(data.message || "Failed to fetch user");
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setError("Failed to fetch user details");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-2xl mx-auto text-center">Loading user details...</div>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
                        {error || "User not found"}
                    </div>
                    <Link href="/admin/users" className="text-blue-600 hover:text-blue-800">
                        ← Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                        <p className="text-gray-600 mt-2">View user information</p>
                    </div>
                    <Link href="/admin/users" className="text-blue-600 hover:text-blue-800">
                        ← Back to Users
                    </Link>
                </div>

                {/* User Card */}
                <div className="bg-white rounded-lg shadow p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Section */}
                        <div>
                            {userData.profilePicture && (
                                <img
                                    src={userData.profilePicture}
                                    alt={userData.fullName}
                                    className="w-full h-64 object-cover rounded-lg mb-4"
                                />
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600">Full Name</label>
                                    <p className="text-lg text-gray-900 mt-1">{userData.fullName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600">Email</label>
                                    <p className="text-lg text-gray-900 mt-1">{userData.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600">Phone Number</label>
                                    <p className="text-lg text-gray-900 mt-1">{userData.phoneNumber || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600">Role</label>
                                <p className="text-lg">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold capitalize inline-block">
                                        {userData.role}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600">Status</label>
                                <p className="text-lg">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${userData.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : userData.status === "suspended"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {userData.status}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600">Address</label>
                                <p className="text-lg text-gray-900 mt-1">{userData.address || "N/A"}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600">Member Since</label>
                                <p className="text-lg text-gray-900 mt-1">
                                    {new Date(userData.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 border-t pt-8 flex gap-4">
                        <Link
                            href={`/admin/users/${userData._id}/edit`}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                        >
                            Edit User
                        </Link>
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
