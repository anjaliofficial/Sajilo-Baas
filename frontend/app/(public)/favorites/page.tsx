"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/app/(auth)/dashboard/_components/Sidebar";
import Header from "@/app/(auth)/dashboard/_components/Header";

interface Booking {
    _id: string;
    listingId: {
        title: string;
        location: string;
        images?: string[];
        pricePerNight: number;
    };
    checkInDate: string;
    checkOutDate: string;
    status: string;
    totalPrice: number;
}

const DUMMY_FAVORITES: Booking[] = [
    {
        _id: "1",
        listingId: {
            title: "Beautiful Mountain Villa",
            location: "Kathmandu",
            images: ["/images/magnificent-hotel (Homes guests love1).jpg"],
            pricePerNight: 5000,
        },
        checkInDate: "2025-04-01",
        checkOutDate: "2025-04-05",
        status: "pending",
        totalPrice: 20000,
    },
    {
        _id: "2",
        listingId: {
            title: "Cozy City Apartment",
            location: "Pokhara",
            images: ["/images/APARTMENTs.avif"],
            pricePerNight: 3000,
        },
        checkInDate: "2025-05-10",
        checkOutDate: "2025-05-15",
        status: "confirmed",
        totalPrice: 15000,
    },
    {
        _id: "3",
        listingId: {
            title: "Lakeside Resort",
            location: "Pokhara",
            images: ["/images/hotel-barahi.jpg"],
            pricePerNight: 4500,
        },
        checkInDate: "2025-06-01",
        checkOutDate: "2025-06-07",
        status: "pending",
        totalPrice: 27000,
    },
    {
        _id: "4",
        listingId: {
            title: "Modern Studio Flat",
            location: "Bhaktapur",
            images: ["/images/Bhaktapur.jpg"],
            pricePerNight: 2500,
        },
        checkInDate: "2025-03-20",
        checkOutDate: "2025-03-25",
        status: "cancelled",
        totalPrice: 12500,
    },
    {
        _id: "5",
        listingId: {
            title: "Heritage Homestay",
            location: "Patan",
            images: ["/images/kathmandu-guest-house.jpg"],
            pricePerNight: 3500,
        },
        checkInDate: "2025-07-15",
        checkOutDate: "2025-07-20",
        status: "confirmed",
        totalPrice: 17500,
    },
    {
        _id: "6",
        listingId: {
            title: "Peaceful Garden Villa",
            location: "Kathmandu",
            images: ["/images/verdant_villa_bhairahawa_nepal_42mm_architecture___media_library_original_1124_632.jpg"],
            pricePerNight: 6000,
        },
        checkInDate: "2025-08-01",
        checkOutDate: "2025-08-04",
        status: "pending",
        totalPrice: 18000,
    },
    {
        _id: "7",
        listingId: {
            title: "Hilltop Bungalow",
            location: "Dhulikhel",
            images: ["/images/mountain lodge.jpg"],
            pricePerNight: 4000,
        },
        checkInDate: "2025-09-10",
        checkOutDate: "2025-09-15",
        status: "confirmed",
        totalPrice: 20000,
    },
    {
        _id: "8",
        listingId: {
            title: "Riverside Cottage",
            location: "Chitwan",
            images: ["/images/Green Park hotel in Chitwan.jpg"],
            pricePerNight: 5500,
        },
        checkInDate: "2025-10-05",
        checkOutDate: "2025-10-10",
        status: "pending",
        totalPrice: 27500,
    },
];

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Use dummy data instead of fetching from API
        setFavorites(DUMMY_FAVORITES);
        setLoading(false);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 pl-3 pt-4 pr-4 pb-4 lg:pl-3 lg:pt-8 lg:pr-8 lg:pb-8 overflow-auto">
                    <h1 className="text-2xl font-bold mb-6">My Favorite Places</h1>
                    {!loading && favorites.length === 0 && <div>No favorites found.</div>}
                    <div className="grid gap-4 md:grid-cols-4">
                        {favorites.map((fav) => (
                            <div key={fav._id} className="border rounded-lg p-3 shadow hover:shadow-lg transition-shadow bg-white">
                                {fav.listingId.images && fav.listingId.images[0] && (
                                    <div className="relative mb-2">
                                        <img src={fav.listingId.images[0]} alt="Listing" className="w-full h-32 object-cover rounded" />
                                        <div className="absolute top-2 right-2">
                                            <div className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                                                <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="font-semibold text-sm line-clamp-2">{fav.listingId.title}</div>
                                <div className="text-gray-600 text-xs">{fav.listingId.location}</div>
                                <div className="text-xs mt-2 space-y-1">
                                    <div>Check-in: {new Date(fav.checkInDate).toLocaleDateString()}</div>
                                    <div>Check-out: {new Date(fav.checkOutDate).toLocaleDateString()}</div>
                                    <div className="font-semibold text-blue-600">NPR {fav.totalPrice}</div>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${fav.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        fav.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {fav.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
