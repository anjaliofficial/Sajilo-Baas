"use client";

import { useEffect, useMemo, useState } from "react";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type SearchPlace = {
    display_name: string;
    lat: string;
    lon: string;
};

type LocationPickerMapProps = {
    latitude?: number;
    longitude?: number;
    onPick: (latitude: number, longitude: number) => void;
    searchText?: string;
    onAddressPick?: (value: {
        location: string;
        city: string;
        neighborhood: string;
        fullAddress: string;
    }) => void;
};

function ClickHandler({ onPick }: { onPick: (latitude: number, longitude: number) => void }) {
    useMapEvents({
        click(event) {
            onPick(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
}

function FlyToPosition({ position }: { position: [number, number] | null }) {
    const map = useMap();

    useEffect(() => {
        if (!position) return;
        map.flyTo(position, 15, { duration: 0.8 });
    }, [map, position]);

    return null;
}

export default function LocationPickerMap({
    latitude,
    longitude,
    onPick,
    searchText,
    onAddressPick,
}: LocationPickerMapProps) {
    const [internalQuery, setInternalQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchPlace[]>([]);
    const [searchError, setSearchError] = useState("");
    const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

    const query = useMemo(() => {
        if (typeof searchText === "string") return searchText;
        return internalQuery;
    }, [internalQuery, searchText]);

    useEffect(() => {
        L.Icon.Default.mergeOptions({
            iconRetinaUrl:
                "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
    }, []);

    const hasLocation =
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);

    const center: [number, number] = hasLocation
        ? [latitude as number, longitude as number]
        : [27.7172, 85.324];

    const searchPlace = async (customQuery?: string) => {
        const term = (customQuery ?? query).trim();

        if (!term) {
            setSuggestions([]);
            setSearchError("");
            return;
        }

        setSearching(true);
        setSearchError("");

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&q=${encodeURIComponent(term)}`;
            const res = await fetch(url, {
                headers: {
                    "Accept-Language": "en",
                },
            });

            if (!res.ok) {
                setSearchError("Location search failed. Please try again.");
                setSuggestions([]);
                return;
            }

            const data = (await res.json()) as SearchPlace[];
            setSuggestions(Array.isArray(data) ? data : []);

            if (!data?.length) {
                setSearchError("No matching places found.");
            }
        } catch {
            setSearchError("Unable to search place right now.");
            setSuggestions([]);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const term = query.trim();

        if (term.length < 3) {
            setSuggestions([]);
            setSearchError("");
            return;
        }

        const timeout = setTimeout(() => {
            void searchPlace(term);
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    const selectPlace = (place: SearchPlace) => {
        const nextLat = Number(place.lat);
        const nextLng = Number(place.lon);

        if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return;

        onPick(nextLat, nextLng);

        const addressParts = place.display_name
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        const city = addressParts.length ? addressParts[addressParts.length - 1] : "";
        const neighborhood = addressParts.length > 1 ? addressParts[addressParts.length - 2] : "";
        const location = [neighborhood, city].filter(Boolean).join(", ") || place.display_name;

        onAddressPick?.({
            location,
            city,
            neighborhood,
            fullAddress: place.display_name,
        });

        setFlyTo([nextLat, nextLng]);
        setInternalQuery(place.display_name);
        setSuggestions([]);
        setSearchError("");
    };

    return (
        <div className="space-y-2">
            {typeof searchText !== "string" && (
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                        Search place/address
                    </label>
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setInternalQuery(event.target.value)}
                        placeholder="Search area, landmark, or full address"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>
            )}

            {searching && <p className="text-xs text-gray-500">Searching places...</p>}
            {searchError && <p className="text-xs text-red-600">{searchError}</p>}
            {suggestions.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    {suggestions.map((place) => (
                        <button
                            key={`${place.lat}-${place.lon}-${place.display_name}`}
                            type="button"
                            onClick={() => selectPlace(place)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                            {place.display_name}
                        </button>
                    ))}
                </div>
            )}

            <p className="text-sm text-gray-600">
                Search above or click directly on the map to set exact coordinates.
            </p>
            <div className="overflow-hidden rounded-lg border border-gray-300">
                <MapContainer center={center} zoom={13} style={{ height: "280px", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ClickHandler onPick={onPick} />
                    <FlyToPosition position={flyTo} />
                    {hasLocation && (
                        <Marker position={[latitude as number, longitude as number]}>
                            <Popup>Selected listing location</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
