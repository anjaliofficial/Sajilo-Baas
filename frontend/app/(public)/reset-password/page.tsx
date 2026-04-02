"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token. Please request a new password reset.");
        }
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                setError(data.message || "Failed to reset password");
            }
        } catch (error) {
            console.error("Error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925')" }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90"></div>

                    <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                        <div className="flex items-center space-x-3">
                            <img src="/images/logo.png" alt="Sajilo Baas Logo" className="w-16 h-16" />
                            <span className="text-2xl font-bold">Sajilo Baas</span>
                        </div>

                        <div>
                            <h2 className="text-4xl font-bold mb-4">Invalid Token</h2>
                            <p className="text-xl opacity-90">
                                It looks like your reset link has expired or is invalid. Don&apos;t worry, you can request a new one!
                            </p>
                        </div>

                        <p className="text-sm opacity-75">© 2024 Sajilo Baas. All rights reserved.</p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                </div>

                {/* Right Side - Error Message */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        <div className="mb-8 text-center lg:text-left">
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Invalid Reset Link</h1>
                            <p className="text-gray-600">Request a new password reset link to continue</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl p-8 border border-gray-100">
                            <div className="mb-6 p-4 bg-white border-l-4 border-red-500 rounded-lg shadow-sm">
                                <p className="text-red-700 text-sm font-medium">
                                    Invalid or missing reset token. Please request a new password reset.
                                </p>
                            </div>

                            <Link
                                href="/forget-password"
                                className="block w-full text-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Request New Reset Link
                            </Link>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600 text-sm">
                                    Remember your password?{" "}
                                    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                                        Back to Login
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1925')" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-purple-600/90"></div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    <div className="flex items-center space-x-3">
                        <img src="/images/logo.png" alt="Sajilo Baas Logo" className="w-16 h-16" />
                        <span className="text-2xl font-bold">Sajilo Baas</span>
                    </div>

                    <div>
                        <h2 className="text-4xl font-bold mb-6">Create Strong Password</h2>
                        <p className="text-xl mb-12 opacity-90">
                            Your password is the key to your account. Make it strong and secure!
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Use Strong Characters</h3>
                                    <p className="text-sm opacity-90">Mix uppercase, lowercase, numbers, and symbols</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Minimum Length</h3>
                                    <p className="text-sm opacity-90">At least 8 characters for better security</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">Keep it Unique</h3>
                                    <p className="text-sm opacity-90">Don&apos;t reuse passwords from other accounts</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm opacity-75">© 2024 Sajilo Baas. All rights reserved.</p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center lg:text-left">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Reset Password</h1>
                        <p className="text-gray-600">Create a strong and secure password for your account</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl p-8 border border-gray-100">
                        {error && (
                            <div className="mb-6 p-4 bg-white border-l-4 border-red-500 rounded-lg shadow-sm">
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-white border-l-4 border-green-500 rounded-lg shadow-sm">
                                <p className="text-green-700 font-semibold mb-1">Success!</p>
                                <p className="text-green-600 text-sm">Your password has been reset successfully. Redirecting to login...</p>
                            </div>
                        )}

                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Confirm password"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Resetting Password...
                                        </>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-gray-600 text-sm">
                                Remember your password?{" "}
                                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                                    Back to Login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
