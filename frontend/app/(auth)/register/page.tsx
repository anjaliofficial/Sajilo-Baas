"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import RegisterForm from "../_components/RegisterForm";

export default function RegisterPage() {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Left Side - Background Image & Brand */}
            <div 
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                style={{
                    backgroundImage: `linear-gradient(135deg, rgba(17, 24, 39, 0.80) 0%, rgba(31, 41, 55, 0.70) 100%), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80')`,
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
                                Start Your Adventure
                            </h3>
                            <p className="text-gray-200 text-lg leading-relaxed">
                                Join thousands of travelers booking unique stays. Create your account and start exploring.
                            </p>
                        </div>

                        {/* Why Choose Us */}
                        <div className="space-y-6 mt-12">
                            <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
                                <div className="flex items-start gap-3 text-white">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Book with Confidence</h4>
                                        <p className="text-sm text-gray-200">Verified properties and secure payment</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
                                <div className="flex items-start gap-3 text-white">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Explore Nepal</h4>
                                        <p className="text-sm text-gray-200">Discover amazing stays across the country</p>
                                    </div>
                                </div>
                            </div>

                            <div className="backdrop-blur-sm bg-white/10 rounded-xl p-4 border border-white/20">
                                <div className="flex items-start gap-3 text-white">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-1">Best Price Guarantee</h4>
                                        <p className="text-sm text-gray-200">Competitive rates for every budget</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section - Trust Indicators */}
                    <div className="border-t border-white/20 pt-6 space-y-4">
                        <div className="flex items-center gap-3 text-white/80">
                            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">SSL Encrypted & Secure Platform</span>
                        </div>
                        <p className="text-sm text-gray-300">
                            © 2026 Sajilo Baas. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    <RegisterForm />
                </div>
            </div>
            </div>
        </GoogleOAuthProvider>
    );
}