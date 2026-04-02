"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { getUserDataClient } from "@/lib/cookie-client";

type User = {
    fullName?: string;
    name?: string;
    profilePicture?: string;
};

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        getUserDataClient().then(setUser);
    }, []);

    return (
        <header className="flex items-center justify-between px-12 py-4 bg-white border-b border-slate-100 sticky top-0 z-50 font-sans">
            {/* Branding */}
            <Link href="/" className="text-2xl font-bold text-[#1a3a4a] no-underline">
                Sajilo Baas
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-8 text-sm font-medium text-slate-600">
                <Link href="/about" className="hover:text-[#1a3a4a]">About Us</Link>
                <Link href="/dashboard" className="hover:text-[#1a3a4a]">My Dashboard</Link>
                <Link href="#" className="hover:text-[#1a3a4a]">Help</Link>
            </nav>

            {/* Auth/User */}
            <div className="flex items-center gap-3">
                {user ? (
                    <>
                        <span className="font-semibold text-[#1a3a4a]">{user.fullName || user.name}</span>
                        {user.profilePicture && (
                            <img src={user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <Link href="/dashboard/customer/profile" className="text-blue-600 px-3 py-1">Profile</Link>
                        <Link href="/logout" className="text-red-500 px-3 py-1">Logout</Link>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="text-[#1a3a4a] font-semibold px-4 py-2">
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
