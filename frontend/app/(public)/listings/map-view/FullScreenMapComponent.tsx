"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom DivIcons with labels like Google Maps
const createStartIcon = () => {
    return L.divIcon({
        className: 'custom-start-marker',
        html: `
            <div style="position: relative;">
                <div style="
                    width: 32px;
                    height: 32px;
                    background: #4285F4;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                ">
                    <div style="
                        width: 12px;
                        height: 12px;
                        background: white;
                        border-radius: 50%;
                    "></div>
                </div>
                <div style="
                    position: absolute;
                    top: 38px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #4285F4;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">Start</div>
            </div>
        `,
        iconSize: [32, 70],
        iconAnchor: [16, 32],
    });
};

const createDestinationIcon = () => {
    return L.divIcon({
        className: 'custom-destination-marker',
        html: `
            <div style="position: relative;">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: #EA4335;
                    border: 4px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        width: 16px;
                        height: 16px;
                        background: white;
                        border-radius: 50%;
                        transform: rotate(45deg);
                    "></div>
                </div>
                <div style="
                    position: absolute;
                    top: 46px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #EA4335;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">Destination</div>
            </div>
        `,
        iconSize: [40, 85],
        iconAnchor: [20, 40],
    });
};

function AutoFitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

interface RouteData {
    distance: number;
    duration: number;
    geometry: [number, number][];
}

interface FullScreenMapComponentProps {
    listingLat: number;
    listingLng: number;
    listingTitle: string;
    customerLat: number | null;
    customerLng: number | null;
}

export default function FullScreenMapComponent({
    listingLat,
    listingLng,
    listingTitle,
    customerLat,
    customerLng,
}: FullScreenMapComponentProps) {
    const router = useRouter();

    const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(
        customerLat !== null && customerLng !== null
            ? { lat: customerLat, lng: customerLng }
            : null
    );
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [fetchingRoute, setFetchingRoute] = useState(false);

    useEffect(() => {
        if (!customerLocation) {
            setRouteData(null);
            return;
        }

        const fetchRoute = async () => {
            setFetchingRoute(true);
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${customerLocation.lng},${customerLocation.lat};${listingLng},${listingLat}?overview=full&geometries=geojson`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.code === "Ok" && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const geometry = route.geometry.coordinates.map((coord: [number, number]) => [
                        coord[1],
                        coord[0],
                    ]);

                    setRouteData({
                        distance: route.distance,
                        duration: route.duration,
                        geometry,
                    });
                } else {
                    setRouteData(null);
                }
            } catch (error) {
                console.error("Failed to fetch route:", error);
                setRouteData(null);
            } finally {
                setFetchingRoute(false);
            }
        };

        fetchRoute();
    }, [customerLocation, listingLat, listingLng]);

    const distance = useMemo(() => {
        if (routeData) {
            return routeData.distance / 1000;
        }
        if (!customerLocation) return null;
        return calculateDistance(
            customerLocation.lat,
            customerLocation.lng,
            listingLat,
            listingLng
        );
    }, [routeData, customerLocation, listingLat, listingLng]);

    const bounds = useMemo(() => {
        if (!customerLocation) return null;
        return L.latLngBounds(
            [customerLocation.lat, customerLocation.lng],
            [listingLat, listingLng]
        );
    }, [customerLocation, listingLat, listingLng]);

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span className="font-medium">Back</span>
                </button>

                <h1 className="text-lg font-semibold text-slate-900 truncate">{listingTitle}</h1>

                <div className="w-20"></div>
            </div>

            {/* Info Bar */}
            {customerLocation && distance !== null && (
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-3 flex-wrap justify-center">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 text-emerald-600"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                            />
                        </svg>
                        <span className="text-sm font-semibold text-emerald-800">
                            {distance < 1
                                ? `${(distance * 1000).toFixed(0)} meters`
                                : `${distance.toFixed(2)} km`}
                            {routeData ? " (by road)" : " (straight)"}
                        </span>
                    </div>

                    {routeData && routeData.duration && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-5 h-5 text-blue-600"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="text-sm font-semibold text-blue-800">
                                ~{Math.ceil(routeData.duration / 60)} min drive
                            </span>
                        </div>
                    )}

                    {fetchingRoute && (
                        <span className="text-xs text-slate-500 italic">Calculating route...</span>
                    )}
                </div>
            )}

            {/* Full Screen Map */}
            <div className="flex-1">
                <MapContainer
                    center={[listingLat, listingLng]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Destination Marker (Listing) */}
                    <Marker position={[listingLat, listingLng]} icon={createDestinationIcon()}>
                        <Popup>
                            <div className="text-center">
                                <strong className="text-sm">{listingTitle}</strong>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Start Marker (Customer) */}
                    {customerLocation && (
                        <Marker
                            position={[customerLocation.lat, customerLocation.lng]}
                            icon={createStartIcon()}
                        >
                            <Popup>
                                <div className="text-center">
                                    <strong className="text-sm">Your Location</strong>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Route Line */}
                    {customerLocation && routeData && routeData.geometry && (
                        <Polyline
                            positions={routeData.geometry}
                            color="#4285F4"
                            weight={5}
                            opacity={0.8}
                        />
                    )}

                    {/* Fallback Straight Line */}
                    {customerLocation && !routeData && !fetchingRoute && (
                        <Polyline
                            positions={[
                                [customerLocation.lat, customerLocation.lng],
                                [listingLat, listingLng],
                            ]}
                            color="#4285F4"
                            weight={4}
                            opacity={0.5}
                            dashArray="10, 10"
                        />
                    )}

                    <AutoFitBounds bounds={bounds} />
                </MapContainer>
            </div>
        </div>
    );
}
