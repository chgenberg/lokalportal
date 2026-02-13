"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImageBitmap(await fetch(imageSrc).then((r) => r.blob()));
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))), "image/jpeg", 0.9);
  });
}

interface ImageCropModalProps {
  open: boolean;
  imageFile: File | null;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
}

const ASPECT = 16 / 9;

export default function ImageCropModal({ open, imageFile, onClose, onCropped }: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels);
      onCropped(blob);
      onClose();
    } catch {
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (open && imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImageUrl(null);
  }, [open, imageFile]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && containerRef.current) {
      const focusable = containerRef.current.querySelector<HTMLElement>("button:not([disabled]), [href], input");
      focusable?.focus();
    }
  }, [open]);

  if (!open || !imageFile || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div ref={containerRef} className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-[400px] sm:h-[450px] relative bg-navy/5">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            style={{ containerStyle: { background: "#f8fafc" } }}
          />
        </div>
        <div className="p-4 border-t border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span id="image-crop-title" className="sr-only">Beskär bild</span>
            <span className="text-[12px] text-gray-500" aria-hidden>Zoom</span>
            <input
              aria-label="Zoom"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-28 accent-navy"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-[13px] font-medium text-gray-500 hover:text-navy border border-border/60 rounded-xl transition-colors" aria-label="Avbryt">
              Avbryt
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-gold text-navy text-[13px] font-semibold rounded-xl hover:shadow-md transition-all disabled:opacity-60">
              {saving ? "Sparar..." : "Använd beskärning"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
