"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import the map component to avoid SSR issues
const FullScreenMapComponent = dynamic<{
    listingLat: number;
    listingLng: number;
    listingTitle: string;
    customerLat: number | null;
    customerLng: number | null;
}>(
    () => import("./FullScreenMapComponent"),
    {
        ssr: false,
        loading: () => (
            <div className="h-screen flex items-center justify-center bg-slate-100">
                <div className="text-lg text-slate-600">Loading map...</div>
            </div>
        ),
    }
);

function MapViewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const listingLat = parseFloat(searchParams.get("lat") || "0");
    const listingLng = parseFloat(searchParams.get("lng") || "0");
    const listingTitle = searchParams.get("title") || "Listing Location";
    const customerLat = searchParams.get("customerLat");
    const customerLng = searchParams.get("customerLng");

    if (!listingLat || !listingLng) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-100">
                <div className="text-center">
                    <p className="text-lg text-slate-600">Invalid location data</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <FullScreenMapComponent
            listingLat={listingLat}
            listingLng={listingLng}
            listingTitle={listingTitle}
            customerLat={customerLat ? parseFloat(customerLat) : null}
            customerLng={customerLng ? parseFloat(customerLng) : null}
        />
    );
}

export default function FullScreenMapPage() {
    return (
        <Suspense
            fallback={
                <div className="h-screen flex items-center justify-center bg-slate-100">
                    <div className="text-lg text-slate-600">Loading map...</div>
                </div>
            }
        >
            <MapViewContent />
        </Suspense>
    );
}

