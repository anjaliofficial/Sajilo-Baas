"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser } from "@/lib/actions/auth-action";
import {
    clearToken,
    clearUserData,
    getUserData,
    setUserData,
} from "@/lib/auth/storage";

interface User {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    role: "customer" | "host" | "admin";
    profilePicture?: string;
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const syncUserFromStorage = () => {
        const storedUser = getUserData<User>();
        setUser(storedUser || null);
        return storedUser || null;
    };

    const fetchUserFromCookie = async () => {
        try {
            const res = await fetch("/api/auth/me");
            const data = await res.json();
            if (data?.user) {
                setUser(data.user);
                setUserData(data.user);
                return data.user as User;
            }
        } catch (error) {
            console.error("Failed to fetch user from cookie:", error);
        }
        return null;
    };

    useEffect(() => {
        // Only run on client side
        if (typeof window === "undefined") return;

        const storedUser = syncUserFromStorage();
        if (storedUser) {
            setLoading(false);
            return;
        }

        fetchUserFromCookie().finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const storedUser = syncUserFromStorage();
        if (!storedUser) {
            void fetchUserFromCookie();
        }
    }, [pathname]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleStorage = (event: StorageEvent) => {
            if (event.key === "user_data") {
                syncUserFromStorage();
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const logout = async () => {
        try {
            await logoutUser();
        } catch (e) {
            console.error("Logout error:", e);
        }

        clearUserData();
        clearToken();
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}