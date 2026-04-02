"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Sidebar from "@/app/(auth)/dashboard/_components/Sidebar";
import Header from "@/app/(auth)/dashboard/_components/Header";

const SearchResultsMap = dynamic(() => import("./SearchResultsMap"), {
    ssr: false,
});

const RAW_API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
const API_BASE = RAW_API_BASE.endsWith("/api")
    ? RAW_API_BASE.slice(0, -4)
    : RAW_API_BASE;

const propertyTypes = [
    { value: "", label: "All types" },
    { value: "room", label: "Room" },
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "homestay", label: "Homestay" },
];

const toImageUrl = (path?: string) => {
    if (!path) return "";
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    const cleaned = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE}${cleaned}`;
};

export default function ListingsPage() {
    const [filters, setFilters] = useState({
        location: "",
        lat: "",
        lng: "",
        radiusKm: "10",
        minPrice: "",
        maxPrice: "",
        propertyType: "",
        availableFrom: "",
        availableTo: "",
        guests: "",
    });
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [listings, setListings] = useState<any[]>([]);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.location) params.set("location", filters.location);
        if (filters.lat) params.set("lat", filters.lat);
        if (filters.lng) params.set("lng", filters.lng);
        if (filters.radiusKm) params.set("radiusKm", filters.radiusKm);
        if (filters.minPrice) params.set("minPrice", filters.minPrice);
        if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
        if (filters.propertyType) params.set("propertyType", filters.propertyType);
        if (filters.availableFrom) params.set("availableFrom", filters.availableFrom);
        if (filters.availableTo) params.set("availableTo", filters.availableTo);
        if (filters.guests) params.set("guests", filters.guests);
        return params.toString();
    }, [filters]);

    const fetchListings = async () => {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/listings${queryString ? `?${queryString}` : ""}`);
            const data = await res.json();
            if (!res.ok) {
                setError(data?.message || "Failed to load listings");
                setListings([]);
                return;
            }

            setListings(data.listings || []);
        } catch {
            setError("Failed to load listings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchListings();
    }, []);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        void fetchListings();
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported in this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFilters((prev) => ({
                    ...prev,
                    lat: position.coords.latitude.toFixed(6),
                    lng: position.coords.longitude.toFixed(6),
                }));
            },
            () => {
                setError("Unable to fetch your current location.");
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    useEffect(() => {
        const controller = new AbortController();

        const loadSuggestions = async () => {
            if (!filters.location.trim()) {
                setSuggestions([]);
                return;
            }

            try {
                const res = await fetch(
                    `/api/listings/location-suggest?q=${encodeURIComponent(filters.location)}&limit=8`,
                    { signal: controller.signal },
                );
                const data = await res.json();
                setSuggestions(data?.suggestions || []);
            } catch {
                setSuggestions([]);
            }
        };

        const timeout = setTimeout(() => {
            void loadSuggestions();
        }, 250);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [filters.location]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 pl-3 pt-4 pr-4 pb-4 lg:pl-3 lg:pt-8 lg:pr-8 lg:pb-8 overflow-auto">
                    {/* Page Header */}
                    <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white rounded-2xl shadow-xl p-3 md:p-4 mb-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold mb-0.5">Browse Accommodations</h1>
                                <p className="text-blue-100 text-xs md:text-sm max-w-3xl">
                                    Discover your perfect stay across Nepal. Filter by location, price, and amenities.
                                </p>
                            </div>
                            <div className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 border border-white/25">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-100">Explore Stays</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Filters - Horizontal Layout */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Search Filters</h2>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-4">
                            {/* First Row: Location and GPS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Location */}
                                <div className="flex flex-col gap-2 relative">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="filter-location">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Location
                                    </label>
                                    <input
                                        id="filter-location"
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        placeholder="e.g., Kathmandu"
                                        value={filters.location}
                                        onChange={(event) =>
                                            setFilters({ ...filters, location: event.target.value })
                                        }
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="absolute top-full mt-1 left-0 right-0 border-2 border-gray-200 rounded-xl bg-white max-h-48 overflow-auto shadow-lg z-10">
                                            {suggestions.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                                                    onClick={() => setFilters({ ...filters, location: item })}
                                                >
                                                    <svg className="w-4 h-4 text-gray-400 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Latitude */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700">Latitude</label>
                                    <input
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        type="number"
                                        step="0.000001"
                                        placeholder="27.7172"
                                        value={filters.lat}
                                        onChange={(event) =>
                                            setFilters({ ...filters, lat: event.target.value })
                                        }
                                    />
                                </div>

                                {/* Longitude */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700">Longitude</label>
                                    <input
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        type="number"
                                        step="0.000001"
                                        placeholder="85.3240"
                                        value={filters.lng}
                                        onChange={(event) =>
                                            setFilters({ ...filters, lng: event.target.value })
                                        }
                                    />
                                </div>

                                {/* Radius & GPS Button */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700">Radius (km)</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all flex-1"
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            placeholder="10"
                                            value={filters.radiusKm}
                                            onChange={(event) =>
                                                setFilters({ ...filters, radiusKm: event.target.value })
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={useCurrentLocation}
                                            className="px-3 bg-blue-100 hover:bg-blue-200 rounded-xl text-blue-600 transition-colors"
                                            title="Use my location"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Second Row: Price, Type, Dates, Guests */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                                {/* Min Price */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700" htmlFor="filter-min-price">
                                        Min Price
                                    </label>
                                    <input
                                        id="filter-min-price"
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        type="number"
                                        placeholder="100"
                                        min="0"
                                        value={filters.minPrice}
                                        onChange={(event) =>
                                            setFilters({ ...filters, minPrice: event.target.value })
                                        }
                                    />
                                </div>

                                {/* Max Price */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700" htmlFor="filter-max-price">
                                        Max Price
                                    </label>
                                    <input
                                        id="filter-max-price"
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        type="number"
                                        placeholder="400"
                                        min="0"
                                        value={filters.maxPrice}
                                        onChange={(event) =>
                                            setFilters({ ...filters, maxPrice: event.target.value })
                                        }
                                    />
                                </div>

                                {/* Property Type */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="filter-type">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        Type
                                    </label>
                                    <select
                                        id="filter-type"
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
                                        value={filters.propertyType}
                                        onChange={(event) =>
                                            setFilters({ ...filters, propertyType: event.target.value })
                                        }
                                    >
                                        {propertyTypes.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Check-in */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700" htmlFor="filter-from">
                                        Check-in
                                    </label>
                                    <input
                                        id="filter-from"
                                        type="date"
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        value={filters.availableFrom}
                                        onChange={(event) =>
                                            setFilters({ ...filters, availableFrom: event.target.value })
                                        }
                                    />
                                </div>

                                {/* Check-out */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700" htmlFor="filter-to">
                                        Check-out
                                    </label>
                                    <input
                                        id="filter-to"
                                        type="date"
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        value={filters.availableTo}
                                        onChange={(event) =>
                                            setFilters({ ...filters, availableTo: event.target.value })
                                        }
                                    />
                                </div>

                                {/* Guests */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2" htmlFor="filter-guests">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                        Guests
                                    </label>
                                    <input
                                        id="filter-guests"
                                        className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        type="number"
                                        min="1"
                                        placeholder="2"
                                        value={filters.guests}
                                        onChange={(event) =>
                                            setFilters({ ...filters, guests: event.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Apply Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Available Properties
                                </h2>
                                <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 font-semibold rounded-full text-sm">
                                    {listings.length} {listings.length === 1 ? 'result' : 'results'}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl border-l-4 border-red-500 bg-white shadow-lg p-6">
                                <div className="flex items-start gap-3">
                                    <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                                        <p className="text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-gray-600 text-lg">Searching for properties...</p>
                                </div>
                            </div>
                        )}

                        {!loading && listings.length === 0 && !error && (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">No properties found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
                            </div>
                        )}

                        {!loading && listings.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                                <SearchResultsMap listings={listings} />
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-3">
                            {listings.map((listing) => {
                                const imageUrl = toImageUrl(listing.images?.[0]);
                                return (
                                    <Link
                                        key={listing._id}
                                        href={`/listings/${listing._id}`}
                                        className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg overflow-hidden transition-all transform hover:-translate-y-0.5"
                                    >
                                        <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={listing.title}
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md capitalize">
                                                    {listing.propertyType || "room"}
                                                </span>
                                            </div>
                                            <div className="absolute top-3 right-3">
                                                <button className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
                                                    <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                    {listing.title}
                                                </h3>
                                                <div className="text-right flex-shrink-0">
                                                    <span className="text-lg font-bold text-blue-600">
                                                        NPR {listing.pricePerNight}
                                                    </span>
                                                    <p className="text-xs text-gray-500">per night</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 text-gray-600">
                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                                <p className="text-xs line-clamp-1">
                                                    {listing.locationDetails?.fullAddress || listing.location}
                                                </p>
                                            </div>

                                            {(listing.locationDetails?.neighborhood || listing.locationDetails?.city) && (
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                    {[listing.locationDetails?.neighborhood, listing.locationDetails?.city]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2 text-xs text-gray-600 pt-1 border-t border-gray-100">
                                                <span className="flex items-center gap-0.5">
                                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                    </svg>
                                                    {listing.maxGuests || 1}
                                                </span>
                                                <span className="flex items-center gap-0.5">
                                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {listing.minStay || 1}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-600 line-clamp-2 pt-2">
                                                {listing.description}
                                            </p>

                                            <div className="pt-3">
                                                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                                                    View Details
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
