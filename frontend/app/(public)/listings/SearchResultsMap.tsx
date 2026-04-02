"use client";

import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type ListingMarker = {
  _id: string;
  title: string;
  pricePerNight: number;
  latitude?: number;
  longitude?: number;
};

interface SearchResultsMapProps {
  listings: ListingMarker[];
}

export default function SearchResultsMap({ listings }: SearchResultsMapProps) {
  const markers = listings.filter(
    (item) =>
      typeof item.latitude === "number" &&
      typeof item.longitude === "number" &&
      Number.isFinite(item.latitude) &&
      Number.isFinite(item.longitude),
  );

  if (!markers.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-sm text-slate-500">
        No map points available for current results.
      </div>
    );
  }

  const center = [markers[0].latitude as number, markers[0].longitude as number] as [number, number];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "340px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {markers.map((item) => (
          <Marker
            key={item._id}
            position={[item.latitude as number, item.longitude as number]}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{item.title}</div>
                <div>NPR {item.pricePerNight} / night</div>
                <Link href={`/listings/${item._id}`} className="text-blue-600 underline">
                  View listing
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
