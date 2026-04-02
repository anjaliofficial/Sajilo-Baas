"use client";

import { useAuth } from "@/app/admin/context/AuthContext";
import { getDashboardPath } from "@/lib/auth/roles";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LocationPickerMap = dynamic(() => import("../../_components/LocationPickerMap"), {
    ssr: false,
});

interface Listing {
    _id: string;
    title: string;
    description: string;
    location: string;
    propertyType: string;
    price: number;
    pricePerNight?: number;
    amenities: string[] | string;
    availableFrom: string;
    availableTo: string;
    minStay: number;
    maxGuests: number;
    cancellationPolicy: string;
    houseRules: string;
    images: string[];
}

// Get proper API base URL for images (without /api suffix)
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const API_BASE = RAW_API_BASE.endsWith("/api")
    ? RAW_API_BASE.slice(0, -4)
    : RAW_API_BASE;

// Normalize image URLs to point to backend
const normalizeImageUrl = (url: string): string => {
    if (!url) return "";

    const normalized = url.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;

    // If already has /uploads/, use as-is
    if (normalized.startsWith("/uploads/")) {
        return `${API_BASE}${normalized}`;
    }

    // Extract just filename and add /uploads/ prefix
    const filename = normalized.split("/").pop() || normalized;
    return `${API_BASE}/uploads/${filename}`;
};

export default function EditListingPage() {
    const { user, loading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const listingId = params?.id as string;
    const isCreateMode = listingId === "new";

    const [listing, setListing] = useState<Listing | null>(null);
    const [pageLoading, setPageLoading] = useState(!isCreateMode);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        city: "",
        neighborhood: "",
        fullAddress: "",
        latitude: "",
        longitude: "",
        propertyType: "room",
        pricePerNight: "",
        amenities: "",
        availableFrom: "",
        availableTo: "",
        minStay: "1",
        maxGuests: "1",
        cancellationPolicy: "moderate",
        houseRules: "",
    });

    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<FileList | null>(null);

    // Check auth
    useEffect(() => {
        if (!loading && user?.role !== "host") {
            router.push(getDashboardPath(user?.role));
            return;
        }
        if (!loading && listing === null && !isCreateMode) {
            fetchListing();
        }
        if (!loading && isCreateMode) {
            setPageLoading(false);
        }
    }, [loading, user, router, listing, isCreateMode]);

    const fetchListing = async () => {
        try {
            const res = await fetch(`/api/listings/${listingId}`);
            if (!res.ok) throw new Error("Failed to fetch listing");

            const data = await res.json();
            const listingData = data.listing || data;

            setListing(listingData);

            // Normalize dates
            const normalizeDate = (value?: string) => {
                if (!value) return "";
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) return "";
                return date.toISOString().slice(0, 10);
            };

            setForm({
                title: listingData.title || "",
                description: listingData.description || "",
                location: listingData.location || "",
                city: listingData.locationDetails?.city || "",
                neighborhood: listingData.locationDetails?.neighborhood || "",
                fullAddress: listingData.locationDetails?.fullAddress || "",
                latitude: listingData.latitude?.toString?.() || "",
                longitude: listingData.longitude?.toString?.() || "",
                propertyType: listingData.propertyType || "room",
                pricePerNight: (listingData.pricePerNight || listingData.price)?.toString() || "",
                amenities: Array.isArray(listingData.amenities)
                    ? listingData.amenities.join(", ")
                    : listingData.amenities || "",
                availableFrom: normalizeDate(listingData.availableFrom),
                availableTo: normalizeDate(listingData.availableTo),
                minStay: listingData.minStay?.toString() || "1",
                maxGuests: listingData.maxGuests?.toString() || "1",
                cancellationPolicy: listingData.cancellationPolicy || "moderate",
                houseRules: listingData.houseRules || "",
            });

            // Set existing image previews
            if (listingData.images && Array.isArray(listingData.images)) {
                setPreviewImages(listingData.images.map((img: string) => normalizeImageUrl(img)));
            }
        } catch (err) {
            setError("Failed to load listing");
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImages(e.target.files);
            const files = Array.from(e.target.files);
            const previews = files.map((file) => URL.createObjectURL(file));
            setPreviewImages(previews);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            let uploadedImagePaths: string[] = [];

            // Upload new images if selected
            if (newImages && newImages.length > 0) {
                const formData = new FormData();
                Array.from(newImages).forEach((file) => {
                    formData.append("files", file);
                });

                console.log("[Edit Listing] Uploading", newImages.length, "files");

                const uploadRes = await fetch("/api/files/upload-files", {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                });

                console.log("[Edit Listing] Upload response status:", uploadRes.status);

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json().catch(() => ({ message: "Upload failed" }));
                    console.error("[Edit Listing] Upload error:", errorData);
                    throw new Error(errorData.message || "Failed to upload images");
                }

                const uploadData = await uploadRes.json();
                console.log("[Edit Listing] Upload success:", uploadData);
                uploadedImagePaths = uploadData.files?.map((f: any) => f.path) || [];
            }

            const payload = {
                title: form.title,
                description: form.description,
                location: form.location,
                city: form.city,
                neighborhood: form.neighborhood,
                fullAddress: form.fullAddress,
                latitude: form.latitude ? Number(form.latitude) : undefined,
                longitude: form.longitude ? Number(form.longitude) : undefined,
                propertyType: form.propertyType,
                amenities: form.amenities.split(",").map((a) => a.trim()),
                pricePerNight: Number(form.pricePerNight),
                availableFrom: form.availableFrom,
                availableTo: form.availableTo,
                minStay: Number(form.minStay),
                maxGuests: Number(form.maxGuests),
                cancellationPolicy: form.cancellationPolicy,
                houseRules: form.houseRules,
                ...(uploadedImagePaths.length > 0 && { images: uploadedImagePaths }),
            };

            const res = await fetch(`/api/listings${isCreateMode ? "" : `/${listingId}`}`, {
                method: isCreateMode ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Failed to ${isCreateMode ? "create" : "update"} listing`);

            setSuccess(`Listing ${isCreateMode ? "created" : "updated"} successfully!`);
            setTimeout(() => {
                router.push("/dashboard/host/listings");
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${isCreateMode ? "create" : "update"} listing`);
        } finally {
            setSubmitting(false);
        }
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported in this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                }));
            },
            () => {
                setError("Unable to fetch current location. Please enter coordinates manually.");
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    const handleMapPick = (latitude: number, longitude: number) => {
        setForm((prev) => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
        }));
    };

    const handleMapAddressPick = (value: {
        location: string;
        city: string;
        neighborhood: string;
        fullAddress: string;
    }) => {
        setForm((prev) => ({
            ...prev,
            location: value.location || prev.location,
            city: value.city || prev.city,
            neighborhood: value.neighborhood || prev.neighborhood,
            fullAddress: value.fullAddress || prev.fullAddress,
        }));
    };

    if (!user || pageLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-lg">{isCreateMode ? "Loading..." : "Loading listing..."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto p-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900">{isCreateMode ? "Create New Listing" : "Edit Listing"}</h1>
                        <p className="text-gray-600 mt-2">{isCreateMode ? "Add a new property to your portfolio" : "Update your property details"}</p>
                    </div>
                </div>
            </div>

            <div className="mx-auto p-6 w-screen" style={{ maxWidth: '1400px' }}>
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Sidebar */}
                    <div className="w-full md:w-1/4 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 h-fit space-y-6">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Steps</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">Basic Info</p>
                                            <p className="text-xs text-gray-500">Title & Description</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0">2</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">Location</p>
                                            <p className="text-xs text-gray-500">Address & Coordinates</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0">3</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">Pricing & Details</p>
                                            <p className="text-xs text-gray-500">Price & Availability</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0">4</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">Images</p>
                                            <p className="text-xs text-gray-500">Property photos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Quick Info</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Property Type:</span>
                                        <span className="font-semibold text-gray-900 capitalize">{form.propertyType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Price/Night:</span>
                                        <span className="font-semibold text-gray-900">NPR {form.pricePerNight || "0"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Max Guests:</span>
                                        <span className="font-semibold text-gray-900">{form.maxGuests}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="w-full md:w-3/4 flex-grow">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            {error && (
                                <div className="mb-6 rounded-xl border-l-4 border-red-500 bg-red-50 p-4 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 rounded-xl border-l-4 border-green-500 bg-green-50 p-4 flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-sm font-medium text-green-800">{success}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location Summary</label>
                                        <input
                                            type="text"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                                        <select
                                            value={form.propertyType}
                                            onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="room">Room</option>
                                            <option value="apartment">Apartment</option>
                                            <option value="house">House</option>
                                            <option value="homestay">Homestay</option>
                                            <option value="villa">Villa</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Night (NPR)</label>
                                        <input
                                            type="number"
                                            value={form.pricePerNight}
                                            onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                        <input
                                            type="text"
                                            value={form.city}
                                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Neighborhood</label>
                                        <input
                                            type="text"
                                            value={form.neighborhood}
                                            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address</label>
                                        <input
                                            type="text"
                                            value={form.fullAddress}
                                            onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-semibold text-gray-700">Coordinates (optional)</label>
                                        <button
                                            type="button"
                                            onClick={useCurrentLocation}
                                            className="text-sm text-blue-700 hover:text-blue-800 font-semibold"
                                        >
                                            Use current location
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={form.latitude}
                                            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                                            placeholder="Latitude"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            type="number"
                                            step="0.000001"
                                            value={form.longitude}
                                            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                                            placeholder="Longitude"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <LocationPickerMap
                                            latitude={form.latitude ? Number(form.latitude) : undefined}
                                            longitude={form.longitude ? Number(form.longitude) : undefined}
                                            searchText={form.fullAddress}
                                            onPick={handleMapPick}
                                            onAddressPick={handleMapAddressPick}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
                                        <input
                                            type="text"
                                            value={form.amenities}
                                            onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                                            placeholder="wifi, parking, kitchen (comma separated)"
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Policy</label>
                                        <select
                                            value={form.cancellationPolicy}
                                            onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="flexible">Flexible</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="strict">Strict</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Available From</label>
                                        <input
                                            type="date"
                                            value={form.availableFrom}
                                            onChange={(e) => setForm({ ...form, availableFrom: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Available To</label>
                                        <input
                                            type="date"
                                            value={form.availableTo}
                                            onChange={(e) => setForm({ ...form, availableTo: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Stay (nights)</label>
                                        <input
                                            type="number"
                                            value={form.minStay}
                                            onChange={(e) => setForm({ ...form, minStay: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            min="1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Max Guests</label>
                                        <input
                                            type="number"
                                            value={form.maxGuests}
                                            onChange={(e) => setForm({ ...form, maxGuests: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">House Rules</label>
                                    <textarea
                                        value={form.houseRules}
                                        onChange={(e) => setForm({ ...form, houseRules: e.target.value })}
                                        placeholder="Quiet hours, no smoking, pet policy, etc."
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>

                                {/* Current Images */}
                                {previewImages.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Images</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {previewImages.map((preview, idx) => (
                                                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                    <img src={preview} alt={`preview ${idx}`} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload New Images</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="image-input"
                                        />
                                        <label htmlFor="image-input" className="cursor-pointer">
                                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-gray-600">Click to upload new images or drag and drop</p>
                                            <p className="text-sm text-gray-500">JPEG, PNG, WebP, GIF, BMP up to 10MB</p>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`flex-1 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-2 ${isCreateMode
                                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                            }`}
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                {isCreateMode ? "Creating..." : "Saving..."}
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCreateMode ? "M12 4v16m8-8H4" : "M5 13l4 4L19 7"} />
                                                </svg>
                                                {isCreateMode ? "Create Listing" : "Save Changes"}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => router.back()}
                                        className="border-2 border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
