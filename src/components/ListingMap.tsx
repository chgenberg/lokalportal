"use client";

import { useEffect, useRef } from "react";
import type { Listing } from "@/lib/types";
import { categoryLabels, typeLabels } from "@/lib/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ListingMapProps {
  listings: Listing[];
  selectedId?: string;
  zoom?: number;
  center?: [number, number];
  className?: string;
  singleMarker?: boolean;
}

function createMarkerIcon() {
  return L.icon({
    iconUrl: "/hittaytapin.png",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

function formatPrice(price: number, type: string) {
  if (type === "sale") return `${(price / 1000000).toFixed(1)} mkr`;
  return `${price.toLocaleString("sv-SE")} kr/mån`;
}

export default function ListingMap({
  listings,
  selectedId,
  zoom,
  center,
  className = "",
  singleMarker = false,
}: ListingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const validListings = listings.filter(
      (l) => l.lat && l.lng && !isNaN(l.lat) && !isNaN(l.lng)
    );

    const defaultCenter: [number, number] = center || [62.0, 15.0];
    const defaultZoom = zoom || (validListings.length === 1 ? 14 : 5);

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const markers: L.Marker[] = [];

    validListings.forEach((listing) => {
      const icon = createMarkerIcon();
      const marker = L.marker([listing.lat, listing.lng], { icon }).addTo(map);

      const popupContent = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif;">
          <div style="display: flex; gap: 6px; margin-bottom: 8px;">
            <span style="
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 600;
              border-radius: 999px;
              background: ${listing.type === "rent" ? "#2563eb" : "#059669"};
              color: white;
            ">${typeLabels[listing.type]}</span>
            <span style="
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 600;
              border-radius: 999px;
              background: #f1f5f9;
              color: #475569;
            ">${categoryLabels[listing.category]}</span>
          </div>
          <a href="/annonser/${listing.id}" style="
            font-size: 14px;
            font-weight: 700;
            color: #0a1628;
            text-decoration: none;
            display: block;
            margin-bottom: 4px;
          ">${listing.title}</a>
          <p style="font-size: 12px; color: #64748b; margin: 0 0 6px;">
            ${listing.address}, ${listing.city}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; color: #64748b;">${listing.size} m²</span>
            <span style="font-size: 15px; font-weight: 700; color: #0a1628;">
              ${formatPrice(listing.price, listing.type)}
            </span>
          </div>
          <a href="/annonser/${listing.id}" style="
            display: block;
            text-align: center;
            margin-top: 10px;
            padding: 8px 16px;
            background: #0a1628;
            color: white;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
          ">Visa annons</a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: "custom-popup",
      });

      if (listing.id === selectedId) {
        marker.openPopup();
      }

      markers.push(marker);
    });

    // Fit bounds if multiple markers
    if (!singleMarker && markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    } else if (markers.length === 1) {
      map.setView([validListings[0].lat, validListings[0].lng], zoom || 14);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [listings, selectedId, zoom, center, singleMarker]);

  return (
    <div
      ref={mapRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "300px" }}
    />
  );
}
