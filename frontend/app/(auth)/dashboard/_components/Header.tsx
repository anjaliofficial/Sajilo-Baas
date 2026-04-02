"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "../../../_components/NotificationBell";

async function fetchAndStoreUser(setUser: (u: any) => void) {
    try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json && json.user) {
            localStorage.setItem("user_data", JSON.stringify(json.user));
            setUser(json.user);
        }
    } catch { }
}

interface User {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    role: string;
    profilePicture?: string;
}

const RAW_API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
    ? RAW_API_BASE.slice(0, -4)
    : RAW_API_BASE;

const toImageUrl = (path?: string) => {
    if (!path) return "/default-avatar.png";
    const normalized = path.replace(/\\/g, "/");
    // If already a full URL, return as is
    if (/^https?:\/\//.test(normalized)) return normalized;
    // If it's a relative path (starts with /uploads or /public), attach to API_BASE
    if (normalized.startsWith("/uploads") || normalized.startsWith("uploads") || normalized.startsWith("/public") || normalized.startsWith("public")) {
        const cleaned = normalized.startsWith("/") ? normalized : `/${normalized}`;
        return `${API_BASE}${cleaned}`;
    }
    // Otherwise, fallback to default avatar
    return "/default-avatar.png";
};

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user_data");
            if (userData) {
                try {
                    setUser(JSON.parse(userData));
                } catch (e) {
                    setUser(null);
                }
            } else {
                // If not in localStorage, fetch from API and sync
                fetchAndStoreUser(setUser);
            }
        }
    }, []);

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("user_data");
            localStorage.removeItem("token");
        }
        router.push("/login");
    };

    return (
        <header className="bg-white border-b border-gray-200 pl-3 pr-6 py-4 shadow-sm sticky top-0 z-20">
            <div className="flex justify-between items-center">
                {/* Left Section - Search or Title */}
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative max-w-md w-full">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Right Section - Notifications & Profile */}
                <div className="flex items-center gap-4">
                    <NotificationBell />

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                {user?.profilePicture ? (
                                    <img
                                        src={toImageUrl(user.profilePicture)}
                                        alt={user.fullName}
                                        className="w-full h-full object-cover"
                                        onError={e => {
                                            // fallback to default avatar if image fails to load
                                            (e.target as HTMLImageElement).src = "/default-avatar.png";
                                        }}
                                    />
                                ) : (
                                    <span>{user?.fullName?.charAt(0)?.toUpperCase() || "U"}</span>
                                )}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                            <svg
                                className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-30">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <a
                                    href={`/dashboard/${user?.role}/profile`}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">My Profile</span>
                                </a>
                                <a
                                    href="/settings"
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-sm text-gray-700">Settings</span>
                                </a>
                                <div className="border-t border-gray-100 my-2"></div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors w-full text-left"
                                >
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span className="text-sm font-medium text-red-600">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}