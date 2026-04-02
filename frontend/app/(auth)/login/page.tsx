"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginForm from "../_components/LoginForm";

export default function LoginPage() {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Left Side - Background Image & Brand */}
                <div
                    className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                    style={{
                        backgroundImage: `linear-gradient(135deg, rgba(17, 24, 39, 0.80) 0%, rgba(31, 41, 55, 0.70) 100%), url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&auto=format&fit=crop&q=80')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

                    <div className="relative z-10 flex flex-col justify-between p-12 h-full">
                        {/* Top Section - Branding */}
                        <div>
                            <div className="mb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <img src="/images/logo.png" alt="Sajilo Baas Logo" className="w-14 h-14 rounded-xl shadow-lg" />
                                    <h2 className="text-3xl font-bold text-white">Sajilo Baas</h2>
                                </div>
                                <h3 className="text-4xl font-bold text-white mb-4 leading-tight">
                                    Welcome Back!
                                </h3>
                                <p className="text-gray-200 text-lg leading-relaxed">
                                    Continue your journey. Book amazing stays and explore beautiful destinations across Nepal.
                                </p>
                            </div>

                            {/* Features */}
                            <div className="space-y-4 mt-12">
                                <div className="flex items-center gap-3 text-white/90">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span>Verified Hosts & Properties</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/90">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span>Instant Booking Confirmation</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/90">
                                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span>Flexible Cancellation Policy</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section - Trust Badges */}
                        <div className="flex flex-wrap gap-4 border-t border-white/20 pt-8">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-white font-medium">Verified Secure</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                <span className="text-sm text-white font-medium">Instant Alerts</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="text-sm text-white font-medium">Top Rated</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                    <div className="w-full max-w-md">
                        <LoginForm />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}