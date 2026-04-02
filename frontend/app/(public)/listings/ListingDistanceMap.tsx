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

// Custom DivIcons with labels like Google Maps (smaller for embedded view)
const createStartIcon = () => {
    return L.divIcon({
        className: 'custom-start-marker',
        html: `
            <div style="position: relative;">
                <div style="
                    width: 24px;
                    height: 24px;
                    background: #4285F4;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        width: 8px;
                        height: 8px;
                        background: white;
                        border-radius: 50%;
                    "></div>
                </div>
                <div style="
                    position: absolute;
                    top: 28px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #4285F4;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                ">Start</div>
            </div>
        `,
        iconSize: [24, 50],
        iconAnchor: [12, 24],
    });
};

const createDestinationIcon = () => {
    return L.divIcon({
        className: 'custom-destination-marker',
        html: `
            <div style="position: relative;">
                <div style="
                    width: 30px;
                    height: 30px;
                    background: #EA4335;
                    border: 3px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        width: 12px;
                        height: 12px;
                        background: white;
                        border-radius: 50%;
                        transform: rotate(45deg);
                    "></div>
                </div>
                <div style="
                    position: absolute;
                    top: 34px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #EA4335;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 10px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                ">Destination</div>
            </div>
        `,
        iconSize: [30, 65],
        iconAnchor: [15, 30],
    });
};

// Helper component to auto-fit bounds when both markers exist
function AutoFitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
}

// Calculate distance between two coordinates (Haversine formula) in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
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
    distance: number; // in meters
    duration: number; // in seconds
    geometry: [number, number][]; // array of [lat, lng]
}

interface ListingDistanceMapProps {
    listingLat: number;
    listingLng: number;
    listingTitle: string;
}

export default function ListingDistanceMap({
    listingLat,
    listingLng,
    listingTitle,
}: ListingDistanceMapProps) {
    const router = useRouter();
    const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string>("");
    const [gettingLocation, setGettingLocation] = useState(false);
    const [routeData, setRouteData] = useState<RouteData | null>(null);
    const [fetchingRoute, setFetchingRoute] = useState(false);

    // Fetch actual road route from OSRM
    useEffect(() => {
        if (!customerLocation) {
            setRouteData(null);
            return;
        }

        const fetchRoute = async () => {
            setFetchingRoute(true);
            try {
                // OSRM routing API (free public server)
                // Format: /route/v1/{profile}/{coordinates}
                const url = `https://router.project-osrm.org/route/v1/driving/${customerLocation.lng},${customerLocation.lat};${listingLng},${listingLat}?overview=full&geometries=geojson`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.code === "Ok" && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
                    const geometry = route.geometry.coordinates.map((coord: [number, number]) => [
                        coord[1],
                        coord[0],
                    ]);

                    setRouteData({
                        distance: route.distance, // meters
                        duration: route.duration, // seconds
                        geometry,
                    });
                } else {
                    // Fallback to straight line if routing fails
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
            return routeData.distance / 1000; // Convert meters to km
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

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        setGettingLocation(true);
        setLocationError("");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCustomerLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setGettingLocation(false);
            },
            (error) => {
                setLocationError(
                    error.code === 1
                        ? "Location access denied. Please enable location permissions."
                        : "Unable to retrieve your location"
                );
                setGettingLocation(false);
            }
        );
    };

    const handleOpenFullScreen = () => {
        const params = new URLSearchParams({
            lat: listingLat.toString(),
            lng: listingLng.toString(),
            title: listingTitle,
        });

        if (customerLocation) {
            params.set("customerLat", customerLocation.lat.toString());
            params.set("customerLng", customerLocation.lng.toString());
        }

        router.push(`/listings/map-view?${params.toString()}`);
    };

    return (
        <div className="space-y-3">
            {/* Show/Hide Distance Button */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                {!customerLocation && (
                    <button
                        onClick={handleGetLocation}
                        disabled={gettingLocation}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                        </svg>
                        {gettingLocation ? "Getting location..." : "Show distance from me"}
                    </button>
                )}

                {customerLocation && distance !== null && (
                    <div className="flex items-center gap-3 flex-wrap">
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

                        <button
                            onClick={() => setCustomerLocation(null)}
                            className="text-slate-500 hover:text-slate-700 text-sm underline"
                        >
                            Hide
                        </button>
                    </div>
                )}
            </div>

            {locationError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-800 text-sm">
                    {locationError}
                </div>
            )}

            {/* Map with Full Screen Button Overlay */}
            <div className="relative">
                <MapContainer
                    center={[listingLat, listingLng]}
                    zoom={13}
                    style={{ height: "400px", width: "100%", borderRadius: "12px" }}
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
                            weight={4}
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
                            weight={3}
                            opacity={0.5}
                            dashArray="10, 10"
                        />
                    )}

                    {/* Auto-fit bounds when both markers exist */}
                    <AutoFitBounds bounds={bounds} />
                </MapContainer>

                {/* Full Screen Button Overlay */}
                <button
                    onClick={handleOpenFullScreen}
                    className="absolute top-3 right-3 z-[1000] bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg shadow-lg border border-slate-200 flex items-center gap-2 text-sm font-medium transition-all hover:shadow-xl"
                    title="Open full screen map"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                        />
                    </svg>
                    Full Screen
                </button>
            </div>
        </div>
    );
}
