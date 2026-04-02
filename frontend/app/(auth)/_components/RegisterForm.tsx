"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import { registerUser } from "@/lib/actions/auth-action";
import { getDashboardPath } from "@/lib/auth/roles";
import {
    clearToken,
    clearUserData,
    setToken,
    setUserData,
} from "@/lib/auth/storage";

export default function RegisterForm() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        address: "",
        password: "",
        confirmPassword: "",
        role: "customer"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleGoogleSignup = async (credentialResponse: any) => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/google/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: credentialResponse.credential,
                }),
            });

            const data = await response.json();

            if (data.success && data.user) {
                clearUserData();
                clearToken();
                setUserData(data.user);
                if (data.token) setToken(data.token);

                const redirectUrl = getDashboardPath(data.user.role);
                router.replace(redirectUrl);
                return;
            }

            setError(data.message || "Google signup failed");
        } catch {
            setError("Connection error during Google signup");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validate passwords match
        if (form.password !== form.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        // Validate phone number is 10 digits
        if (!/^\d{10}$/.test(form.phoneNumber)) {
            setError("Phone number must be 10 digits");
            setLoading(false);
            return;
        }

        try {
            const res = await registerUser(form);

            if (res.success) {
                alert("Registration successful! Please login.");
                router.push("/login");
            } else {
                setError(res.message || "Registration failed");
                setLoading(false);
            }
        } catch (err) {
            setError("An error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-10 text-center lg:text-left">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Create Account</h1>
                <p className="text-gray-600 text-lg">Join Sajilo Baas and start exploring</p>
            </div>

            {/* Card Container */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl p-8 border border-blue-100 backdrop-blur-sm">

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="font-semibold text-red-800 mb-1">Error</p>
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Full Name
                    </label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                        value={form.fullName}
                        onChange={e => setForm({ ...form, fullName: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Email Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Email Address
                    </label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Phone and Role - Two Columns */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            placeholder="9800000000"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                            value={form.phoneNumber}
                            onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Account Type
                        </label>
                        <select
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                            value={form.role}
                            onChange={e => setForm({ ...form, role: e.target.value })}
                            disabled={loading}
                        >
                            <option value="customer">Customer</option>
                            <option value="host">Host</option>
                        </select>
                    </div>
                </div>

                {/* Address Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Address
                    </label>
                    <input
                        type="text"
                        placeholder="Kathmandu, Nepal"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                {/* Password Inputs - Two Columns */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                            value={form.confirmPassword}
                            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Register Button */}
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition transform hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                        </span>
                    ) : (
                        "Create Account"
                    )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                </div>

                {/* Google Signup Button */}
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSignup}
                        onError={() => setError("Google signup failed")}
                    />
                </div>
            </form>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center">
                <p className="text-gray-600">
                    Already have an account?{" "}
                    <Link 
                        href="/login" 
                        className="text-blue-600 hover:text-blue-700 font-bold transition"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}