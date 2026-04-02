"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";

export default function CustomerDashboard() {
    const { user, loading } = useAuth();
    const [ready, setReady] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role !== "customer") {
            router.replace(getDashboardPath(user.role));
            return;
        }

        setReady(true);
    }, [loading, user, router]);

    useEffect(() => {
        if (ready) {
            fetchBookings();
        }
    }, [ready]);

    const fetchBookings = async () => {
        try {
            const response = await fetch("/api/bookings/customer/my", {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setBookings(data.bookings || []);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    // Calculate stats
    const totalBookings = bookings.length;
    const activeTrips = bookings.filter(
        (b) => b.status === "confirmed" || b.status === "pending"
    ).length;

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
        <div className="min-h-screen bg-gray-50">
            {/* Welcome Header with Gradient Background */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 rounded-2xl shadow-2xl p-4 mb-6 text-white relative overflow-hidden max-w-7xl mx-auto">
                <div className="relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-0.5">
                                Welcome back, {user.fullName?.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-blue-100 text-sm">Ready to explore your next adventure?</p>
                        </div>
                        <Link
                            href="/listings"
                            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Browse Listings
                        </Link>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Trending Destinations Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Trending destinations</h2>
                    <p className="text-gray-600 mb-6">Popular destinations to kickstart your planning</p>

                    {/* Category Filters */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {["Popular", "Explore Nepal", "Photography", "Cultural Exploration", "Adventure Sports", "Relaxation & Sights", "Trekking & Hiking"].map((cat) => (
                            <button key={cat} className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${cat === "Popular" ? "bg-blue-500 text-white" : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Destination Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { name: "Kathmandu", location: "Capital City", image: "/images/kathmandu-guest-house.jpg", flag: "🇳🇵" },
                            { name: "Pokhara", location: "Lake City", image: "/images/hotel-barahi.jpg", flag: "🇳🇵" },
                            { name: "Chitwan", location: "Safari Paradise", image: "/images/Green Park hotel in Chitwan.jpg", flag: "🇳🇵" },
                            { name: "Ilam", location: "Tea Gardens", image: "/images/Ilam hotel.jpg", flag: "🇳🇵" },
                            { name: "Dhangadhi", location: "Far-Western Region", image: "/images/Hotel devottee.jpg", flag: "🇳🇵" },
                            { name: "Bhaktapur", location: "Ancient City", image: "/images/Bhaktapur.jpg", flag: "🇳🇵" },
                            { name: "Ghandruk", location: "Kaski", image: "/images/Ghandruk-Hotels.jpg", flag: "🇳🇵" },
                            { name: "Mardi Himal", location: "Kaski", image: "/images/Hotel-at-mardi-himal.jpg", flag: "🇳🇵" },
                        ].map((dest, idx) => (
                            <div key={idx} className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group">
                                <img src={dest.image} alt={dest.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-end justify-end p-4">
                                    <h3 className="text-white text-2xl font-bold flex items-center gap-2">{dest.name} <span>{dest.flag}</span></h3>
                                    <p className="text-white text-sm">{dest.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Browse by Property Type */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Browse by property type</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { name: "Hotels", image: "/images/hotel-barahi.jpg" },
                            { name: "Apartments", image: "/images/APARTMENTs.avif" },
                            { name: "Resorts", image: "/images/Sunsine resort.jpg" },
                            { name: "Villas", image: "/images/verdant_villa_bhairahawa_nepal_42mm_architecture___media_library_original_1124_632.jpg" },
                        ].map((prop, idx) => (
                            <div key={idx} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                                <img src={prop.image} alt={prop.name} className="w-full h-48 object-cover" />
                                <div className="p-4 bg-white">
                                    <h3 className="text-lg font-bold text-gray-900">{prop.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Deals for the Weekend */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Deals for the weekend</h2>
                    <p className="text-gray-600 mb-6">Save on stays for March 6 - March 8</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Majestic Lake Front Hotel", location: "Pokhara, Nepal", rating: 8.8, reviews: 453, price: "NPR 21,646", image: "/images/Majestic Lake Front Hotel.jpg" },
                            { name: "Hotel Barahi", location: "Pokhara, Nepal", rating: 9.3, reviews: 2472, price: "NPR 10,626", image: "/images/hotel-barahi.jpg" },
                            { name: "Dorje Resort", location: "Pokhara, Nepal", rating: 9.9, reviews: 735, price: "NPR 27,663", image: "/images/Dorje resort.jpg" },
                            { name: "Shree Antu Hotel", location: "Ilam, Nepal", rating: 9.6, reviews: 580, price: "NPR 5,569", image: "/images/Shree antuu hotel.jpg" },
                        ].map((deal, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="relative">
                                    <img src={deal.image} alt={deal.name} className="w-full h-40 object-cover" />
                                    <button className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 transition-all">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                    <span className="absolute bottom-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Genius</span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-1">{deal.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{deal.location}</p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">{deal.rating}</span>
                                        <span className="text-sm text-gray-600">{deal.reviews} reviews</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{deal.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stay at our unique properties */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Stay at our top unique properties</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Mountain Lodge", location: "Nepal", rating: 9.7, image: "/images/mountain lodge.jpg" },
                            { name: "Forest Cabin", location: "Dhangadhi, Nepal", rating: 9.6, image: "/images/forest cabin Dhangadhi.jpg" },
                            { name: "Hotel at Mardi Himal", location: "Pokhara, Nepal", rating: 9.3, image: "/images/Hotel-at-mardi-himal.jpg" },
                            { name: "Hotel Devottee", location: "Dhangadhi, Nepal", rating: 9.9, image: "/images/Hotel devottee.jpg" },
                        ].map((prop, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="relative">
                                    <img src={prop.image} alt={prop.name} className="w-full h-40 object-cover" />
                                    <button className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-1">{prop.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{prop.location}</p>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">{prop.rating}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Homes guests love */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900">Homes guests love</h2>
                        <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">Discover homes</a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Magnificent Hotel", location: "Kathmandu, Nepal", rating: 8.8, price: "NPR 14,906", image: "/images/magnificent-hotel (Homes guests love1).jpg" },
                            { name: "Hotel Manaslu", location: "Kathmandu, Nepal", rating: 8.1, price: "NPR 11,524", image: "/images/hotel manaslu (Homes guests love2).jpg" },
                            { name: "Honey Guide Hotel", location: "Rasuwa, Nepal", rating: 8.7, price: "NPR 25,645", image: "/images/Honey guide.jpg" },
                            { name: "Ghandruk Hotels", location: "Ghandruk, Nepal", rating: 8.9, price: "NPR 22,343", image: "/images/Ghandruk-Hotels.jpg" },
                        ].map((home, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="relative">
                                    <img src={home.image} alt={home.name} className="w-full h-40 object-cover" />
                                    <button className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-1">{home.name}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{home.location}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-bold">{home.rating}</span>
                                        <p className="font-semibold text-gray-900">Starting from {home.price}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to Action Section */}
                <div className="bg-blue-600 rounded-3xl p-12 mb-12 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold mb-4">Hey {user.fullName?.split(' ')[0]}, want to feel at home</h2>
                        <p className="text-xl mb-6">on your next adventure?</p>
                        <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all">
                            Discover vacation rentals
                        </button>
                    </div>
                </div>

                {/* Travel More Spend Less */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Travel more, spend less</h2>
                    <p className="text-gray-600 mb-8">
                        <a href="#" className="text-blue-600 font-semibold">Learn more about your rewards</a>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">🎁</span>
                                <h3 className="font-bold text-lg">Genius</h3>
                            </div>
                            <p className="text-sm mb-4">{user.fullName?.split(' ')[0]}, you're at Genius Level 1 in our loyalty program</p>
                        </div>
                        <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">🏨</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">10% discounts on stays</h3>
                            <p className="text-sm text-gray-600">Enjoy discounts at participating properties worldwide</p>
                        </div>
                        <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">🚗</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">10% discounts on rental cars</h3>
                            <p className="text-sm text-gray-600">Save on select rental cars</p>
                        </div>
                    </div>
                </div>

                {/* Popular destinations */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Popular with travelers from Nepal</h2>
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {["Domestic cities", "International cities", "Countries", "Places to stay"].map((cat) => (
                            <button key={cat} className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${cat === "Domestic cities" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 mt-12">
                {/* Newsletter Section */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-white font-bold text-xl mb-2">Subscribe to our newsletter</h3>
                                <p className="text-white/80">Get the latest deals and travel inspiration delivered to your inbox</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input type="email" placeholder="Enter your email" className="flex-1 md:flex-none px-4 py-2 rounded-lg text-gray-900 focus:outline-none" />
                                <button className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all">Subscribe</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
                        {/* About Section */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                <span className="text-white font-bold text-xl">Sajilo Baas</span>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">Discover amazing accommodations and create unforgettable memories across Nepal and beyond.</p>
                            <div className="flex gap-4">
                                <a href="#" className="text-gray-400 hover:text-white transition-all">📘</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-all">🐦</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-all">📷</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-all">▶️</a>
                            </div>
                        </div>

                        {/* Support */}
                        <div>
                            <h3 className="text-white font-bold mb-4">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-all">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Safety Information</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Cancellation Options</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Report Issue</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Contact Us</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="text-white font-bold mb-4">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-all">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Our Story</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Press</a></li>
                            </ul>
                        </div>

                        {/* Hosting */}
                        <div>
                            <h3 className="text-white font-bold mb-4">For Hosts</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-all">List Your Property</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Hosting Guide</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Host Community</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Host Resources</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Policies</a></li>
                            </ul>
                        </div>

                        {/* Destinations */}
                        <div>
                            <h3 className="text-white font-bold mb-4">Nepal Destinations</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-all">Kathmandu</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Pokhara</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Chitwan</a></li>
                                <li><a href="#" className="hover:text-white transition-all">Ilam</a></li>
                                <li><a href="#" className="hover:text-white transition-all">More...</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-700 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Legal Links */}
                            <div>
                                <h3 className="text-white font-bold mb-4">Legal</h3>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:text-white transition-all">Privacy Policy</a></li>
                                    <li><a href="#" className="hover:text-white transition-all">Terms of Service</a></li>
                                    <li><a href="#" className="hover:text-white transition-all">Cookie Policy</a></li>
                                    <li><a href="#" className="hover:text-white transition-all">Community Guidelines</a></li>
                                </ul>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 className="text-white font-bold mb-4">Contact Info</h3>
                                <ul className="space-y-2 text-sm">
                                    <li>📧 Email: <a href="mailto:support@sajilobaas.com" className="hover:text-white transition-all">support@sajilobaas.com</a></li>
                                    <li>📱 Phone: <a href="tel:+977-1-5000000" className="hover:text-white transition-all">+977-1-5000000</a></li>
                                    <li>📍 Address: Kathmandu, Nepal</li>
                                    <li>⏰ Available: 24/7 Support</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="border-t border-gray-700 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-sm text-gray-400 mb-4 md:mb-0">© 2026 Sajilo Baas. All rights reserved. | Your trusted travel companion in Nepal 🇳🇵</p>
                            <div className="flex gap-6">
                                <select className="bg-gray-800 text-white px-3 py-2 rounded text-sm border border-gray-700 focus:outline-none">
                                    <option>English</option>
                                    <option>Nepali</option>
                                    <option>Español</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}