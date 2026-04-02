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
}

interface FormData {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    role: string;
    status: string;
}

export default function EditUser() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;
    const { user, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState<User | null>(null);
    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        role: "customer",
        status: "active",
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
                setFormData({
                    fullName: data.user.fullName,
                    email: data.user.email,
                    phoneNumber: data.user.phoneNumber,
                    address: data.user.address,
                    role: data.user.role,
                    status: data.user.status,
                });
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

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const token = getToken();
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                setSuccess("User updated successfully!");
                setTimeout(() => {
                    router.push(`/admin/users/${userId}`);
                }, 1500);
            } else {
                setError(data.message || "Failed to update user");
            }
        } catch (error) {
            console.error("Failed to update user:", error);
            setError("Failed to update user. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-2xl mx-auto text-center">Loading user details...</div>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4">
                        {error}
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
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
                        <p className="text-gray-600 mt-2">Update user information</p>
                    </div>
                    <Link href="/admin/users" className="text-blue-600 hover:text-blue-800">
                        ← Back to Users
                    </Link>
                </div>

                {/* Edit Form */}
                <div className="bg-white rounded-lg shadow p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-lg">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 bg-green-50 text-green-800 p-4 rounded-lg">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Address
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Role
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="customer">Customer</option>
                                <option value="host">Host</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="banned">Banned</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-6 border-t">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                            >
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
