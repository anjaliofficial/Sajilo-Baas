"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgetPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/send-reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setEmail("");
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(data.message || "Failed to send reset email");
            }
        } catch (error) {
            console.error("Error:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Left Side - Background Image & Brand */}
            <div
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                style={{
                    backgroundImage: `linear-gradient(135deg, rgba(17, 24, 39, 0.80) 0%, rgba(31, 41, 55, 0.70) 100%), url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

                <div className="relative z-10 flex flex-col justify-center items-center p-12 h-full text-center">
                    {/* Logo & Branding */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <img src="/images/logo.png" alt="Sajilo Baas Logo" className="w-16 h-16 rounded-xl shadow-lg" />
                            <h2 className="text-4xl font-bold text-white">Sajilo Baas</h2>
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4 leading-tight">
                            Don't Worry!
                        </h3>
                        <p className="text-gray-200 text-lg leading-relaxed max-w-md mx-auto">
                            We'll help you reset your password and get back to exploring amazing stays in Nepal.
                        </p>
                    </div>

                    {/* Help Steps */}
                    <div className="space-y-4 mt-12 max-w-md">
                        <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">1</div>
                                <p className="text-left">Enter your registered email address</p>
                            </div>
                        </div>
                        <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">2</div>
                                <p className="text-left">Check your email for reset link</p>
                            </div>
                        </div>
                        <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">3</div>
                                <p className="text-left">Create a new secure password</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-4xl font-bold text-gray-900 mb-3">Reset Password</h1>
                        <p className="text-gray-600 text-lg">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl p-8 border border-blue-100 backdrop-blur-sm">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                <p className="font-semibold text-red-800 mb-1">Error</p>
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                                <p className="font-semibold text-green-800 mb-2">Success!</p>
                                <p className="text-green-700 text-sm">Password reset link has been sent to your email. You will be redirected to login page shortly.</p>
                            </div>
                        )}

                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 bg-gray-50 hover:bg-white"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition transform hover:shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            Remember your password?{" "}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold transition">
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
