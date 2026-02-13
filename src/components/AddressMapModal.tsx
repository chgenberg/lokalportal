"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PIN_ICON = L.icon({
  iconUrl: "/hittaytapin.png",
  iconSize: [36, 44],
  iconAnchor: [18, 44],
});

interface AddressMapModalProps {
  open: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onSelect: (displayName: string, lat: number, lng: number) => void;
}

export default function AddressMapModal({
  open,
  onClose,
  initialLat,
  initialLng,
  initialAddress,
  onSelect,
}: AddressMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!open || !mapRef.current) return;

    const hasCoords =
      initialLat != null &&
      initialLng != null &&
      !Number.isNaN(initialLat) &&
      !Number.isNaN(initialLng);
    const center: [number, number] = hasCoords ? [initialLat, initialLng] : [62.0, 15.0];
    const zoom = hasCoords ? 15 : 5;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(center, { icon: PIN_ICON, draggable: true }).addTo(map);
    markerRef.current = marker;

    const fetchReverse = (lat: number, lng: number) => {
      setLoading(true);
      setError(null);
      fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.display_name) {
            onSelectRef.current(data.display_name, lat, lng);
          } else {
            setError("Kunde inte hämta adress");
          }
        })
        .catch(() => setError("Kunde inte hämta adress"))
        .finally(() => setLoading(false));
    };

    const initFromAddress = async () => {
      if (!initialAddress?.trim() || hasCoords) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(initialAddress.trim())}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.lat != null && data.lng != null) {
          map.setView([data.lat, data.lng], 15);
          marker.setLatLng([data.lat, data.lng]);
          onSelectRef.current(data.display_name || initialAddress, data.lat, data.lng);
        }
      } catch {
        setError("Kunde inte hitta adressen på kartan");
      } finally {
        setLoading(false);
      }
    };

    initFromAddress();

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      fetchReverse(pos.lat, pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      fetchReverse(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      marker.off();
      map.off();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [open, initialLat, initialLng, initialAddress]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-map-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4"
    >
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-full sm:max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <p id="address-map-title" className="text-sm font-semibold text-navy">Placera pin på kartan</p>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-gray-400 hover:text-navy"
            aria-label="Stäng"
          >
            &times;
          </button>
        </div>
        <div ref={mapRef} className="h-64 sm:h-80 w-full" />
        {loading && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/95 rounded-lg shadow text-xs text-gray-600">
            Hämtar adress...
          </div>
        )}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-sm text-red-700">
            {error}
          </div>
        )}
        <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-border/40">
          Klicka på kartan eller dra pinnen. Adressen uppdateras i fältet ovan.
        </p>
      </div>
    </div>
  );
}
