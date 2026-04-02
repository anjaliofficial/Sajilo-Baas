"use client";
import React from "react";
import Link from "next/link";
import {
    MapPin, Home, Shield, Star, Search, Calendar,
    Users, Filter, ChevronDown, Facebook, Instagram, Twitter
} from "lucide-react";
import "./globals.css";

export default function LandingPage() {
    return (
        <div className="font-sans text-gray-800 bg-white">
            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-16 py-0 border-b border-gray-200 sticky top-0 bg-white z-50">
                <div className="flex items-center gap-3 text-2xl font-bold text-[rgb(26,58,74)]">
                    <img src="/images/logo.png" alt="Sajilo Baas Logo" className="w-20 h-20 rounded-lg object-cover" />
                    <span>Sajilo Baas</span>
                </div>
                <div className="flex gap-6 items-center text-sm">
                    <Link href="#" className="text-gray-600">List a Property</Link>
                    <Link href="#" className="text-gray-600">About Us</Link>
                    <Link href="#" className="text-gray-600">Help</Link>
                    <Link href="/login" className="text-[#1a3a4a] font-semibold px-4 py-2 rounded-lg bg-sky-100">Login</Link>
                    <Link href="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold">Sign Up</Link>
                </div>
            </nav>

            {/* HERO */}
            <header className="relative h-[550px] flex flex-col items-center justify-center text-center text-white">
                <div className="absolute inset-0">
                    <img src="/images/hero.avif" alt="Nepal Mountains" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative z-10 mb-10">
                    <h1 className="text-5xl font-extrabold mb-2">Find Your Perfect Stay in Nepal</h1>
                    <p className="text-lg opacity-90">Discover and book unique homes and local experiences.</p>
                </div>

                {/* SEARCH BAR */}
                <div className="relative z-10 bg-white p-5 rounded-2xl flex items-center gap-4 shadow-xl w-11/12 max-w-4xl text-gray-700">
                    <div className="flex-1.5">
                        <label className="text-xs font-bold mb-1 block">Location</label>
                        <div className="flex items-center bg-slate-50 p-2 rounded-lg">
                            <Search size={18} className="text-slate-400" />
                            <input type="text" placeholder="e.g., Kathmandu" className="ml-2 w-full bg-transparent outline-none" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold mb-1 block">Check-in</label>
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                            <span className="text-slate-400 text-sm">Select Date</span>
                            <Calendar size={18} className="text-slate-400" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold mb-1 block">Guests</label>
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                            <span className="text-sm">2 Guests</span>
                            <ChevronDown size={18} className="text-slate-400" />
                        </div>
                    </div>
                    <button className="h-12 bg-[#1a3a4a] text-white px-6 rounded-lg font-bold flex items-center gap-2 hover:bg-[#162a38] transition">
                        <Search size={18} /> Search
                    </button>
                </div>
            </header>

            {/* FILTERS */}
            <div className="px-16 py-6 flex gap-3 border-b border-gray-200 bg-gray-50">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
                    <Filter size={16} /> Property Type
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
                    <Filter size={16} /> Price Range
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition">
                    <Filter size={16} /> More Filters
                </button>
            </div>

            {/* FEATURED LISTINGS */}
            <section className="px-16 py-12">
                <h2 className="text-3xl font-bold mb-8 text-gray-900">Featured Listings</h2>
                <div className="grid grid-cols-4 gap-6">
                    {/* Listing Card 1 */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer">
                        <div className="relative">
                            <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=500" alt="Modern City View Apartment" className="w-full h-48 object-cover" />
                            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Featured</div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Luxury | Kathmandu</p>
                            <h3 className="font-semibold text-gray-900 mb-3">Modern City View Apartment</h3>
                            <div className="flex gap-4 text-sm text-gray-600 mb-3 border-b pb-3">
                                <span className="flex items-center gap-1"><Home size={14} /> 2 Beds</span>
                                <span className="flex items-center gap-1"><Users size={14} /> 1 Bath</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">NPR 2,000<span className="text-sm font-normal">/night</span></span>
                                <div className="flex items-center gap-1">
                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-semibold">4.3</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Listing Card 2 */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer">
                        <div className="relative">
                            <img src="/images/Bhaktapur.jpg" alt="Historic Bhaktapur Home" className="w-full h-48 object-cover" />
                            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Hot Deal</div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Traditional | Bhaktapur</p>
                            <h3 className="font-semibold text-gray-900 mb-3">Historic Bhaktapur Home</h3>
                            <div className="flex gap-4 text-sm text-gray-600 mb-3 border-b pb-3">
                                <span className="flex items-center gap-1"><Home size={14} /> 3 Beds</span>
                                <span className="flex items-center gap-1"><Users size={14} /> 2 Baths</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">NPR 4,500<span className="text-sm font-normal">/night</span></span>
                                <div className="flex items-center gap-1">
                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-semibold">4.8</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Listing Card 3 */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer">
                        <div className="relative">
                            <img src="/images/hotel-barahi.jpg" alt="Lakeside Guesthouse" className="w-full h-48 object-cover" />
                            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Best Value</div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Resort | Pokhara</p>
                            <h3 className="font-semibold text-gray-900 mb-3">Lakeside Guesthouse</h3>
                            <div className="flex gap-4 text-sm text-gray-600 mb-3 border-b pb-3">
                                <span className="flex items-center gap-1"><Home size={14} /> 2 Beds</span>
                                <span className="flex items-center gap-1"><Users size={14} /> 2 Baths</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">NPR 6,000<span className="text-sm font-normal">/night</span></span>
                                <div className="flex items-center gap-1">
                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-semibold">4.9</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Listing Card 4 */}
                    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer">
                        <div className="relative">
                            <img src="/images/gold-room.jpg" alt="Mountain Vista Villa" className="w-full h-48 object-cover" />
                            <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Luxury</div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs text-gray-500 mb-1">Vacation | Nagarkot</p>
                            <h3 className="font-semibold text-gray-900 mb-3">Mountain Vista Villa</h3>
                            <div className="flex gap-4 text-sm text-gray-600 mb-3 border-b pb-3">
                                <span className="flex items-center gap-1"><Home size={14} /> 4 Beds</span>
                                <span className="flex items-center gap-1"><Users size={14} /> 3 Baths</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">NPR 12,000<span className="text-sm font-normal">/night</span></span>
                                <div className="flex items-center gap-1">
                                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-semibold">5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* EXPLORE POPULAR DESTINATIONS */}
            <section className="px-16 py-12">
                <h2 className="text-3xl font-bold mb-8 text-gray-900">Explore Popular Destinations</h2>
                <div className="grid grid-cols-3 gap-6">
                    {/* Kathmandu */}
                    <div className="relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer group">
                        <img src="/images/kathmandu-guest-house.jpg" alt="Kathmandu" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                            <h3 className="text-2xl font-bold text-white">Kathmandu</h3>
                        </div>
                    </div>

                    {/* Pokhara */}
                    <div className="relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer group">
                        <img src="/images/Ghandruk-Hotels.jpg" alt="Ghandruk" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                            <h3 className="text-2xl font-bold text-white">Ghandruk</h3>
                        </div>
                    </div>

                    {/* Chitwan */}
                    <div className="relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer group">
                        <img src="/images/Green Park hotel in Chitwan.jpg" alt="Chitwan" className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                            <h3 className="text-2xl font-bold text-white">Chitwan</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-gray-100 px-16 py-12">
                <div className="grid grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/images/logo.png" alt="Logo" className="w-16 h-16 rounded" />
                            <span className="font-bold text-xl">Sajilo Baas</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">Your trusted platform for finding perfect stays in Nepal</p>
                        <div className="flex gap-3">
                            <Link href="#" className="text-gray-400 hover:text-blue-400 transition"><Facebook size={18} /></Link>
                            <Link href="#" className="text-gray-400 hover:text-pink-400 transition"><Instagram size={18} /></Link>
                            <Link href="#" className="text-gray-400 hover:text-blue-300 transition"><Twitter size={18} /></Link>
                        </div>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Support</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Help Center</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Contact Us</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Safety & Security</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Cancellation options</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Report an issue</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">About Us</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Careers</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Blog</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Press</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Investor Relations</Link></li>
                        </ul>
                    </div>

                    {/* Hosting */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Hosting</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">List your property</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Hosting guide</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Hosting resources</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Community forum</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Quality assurance</Link></li>
                        </ul>
                    </div>

                    {/* Discover */}
                    <div>
                        <h4 className="font-bold text-white mb-4">Discover</h4>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Recommendations</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Travel guides</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Trending destinations</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Seasonal deals</Link></li>
                            <li><Link href="#" className="text-gray-400 text-sm hover:text-white transition">Mobile app</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-8">
                    <div className="grid grid-cols-3 gap-8 mb-6">
                        <div>
                            <h5 className="font-semibold text-white mb-2">Language & Currency</h5>
                            <div className="flex gap-4 text-sm">
                                <button className="text-gray-400 hover:text-white">English</button>
                                <button className="text-gray-400 hover:text-white">नेपाली</button>
                                <button className="text-gray-400 hover:text-white">NPR ₨</button>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-white mb-2">Download App</h5>
                            <div className="flex gap-3 text-sm">
                                <Link href="#" className="text-gray-400 hover:text-white">iOS App</Link>
                                <Link href="#" className="text-gray-400 hover:text-white">Android App</Link>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-white mb-2">Legal</h5>
                            <div className="flex gap-3 text-sm">
                                <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
                                <Link href="#" className="text-gray-400 hover:text-white">Terms of Service</Link>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
                        <p>© 2025 Sajilo Baas Nepal. All rights reserved. | Made with ❤️ in Nepal</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}