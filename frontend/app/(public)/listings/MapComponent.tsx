"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapComponent({
    lat,
    lng,
    title,
}: {
    lat: number;
    lng: number;
    title: string;
}) {
    return (
        <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ height: "300px", width: "100%", borderRadius: "12px" }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]}>
                <Popup>{title}</Popup>
            </Marker>
        </MapContainer>
    );
}