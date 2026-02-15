"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Listing } from "@/lib/types";
import type { NearbyData, PriceContext, DemographicsData } from "@/lib/types";
import { formatCategories, typeLabels, parseCategories, getListingImages } from "@/lib/types";
import { formatPrice } from "@/lib/formatPrice";

// Site colors från globals.css – samma palett som hittayta.se
const PAGE_W = 210;
const PAGE_H = 297;

const COLORS = {
  navy: [10 / 255, 22 / 255, 40 / 255] as [number, number, number], // #0a1628
  navyLight: [22 / 255, 34 / 255, 64 / 255] as [number, number, number], // #162240
  gold: [201 / 255, 169 / 255, 110 / 255] as [number, number, number], // #C9A96E
  goldDark: [184 / 255, 149 / 255, 94 / 255] as [number, number, number], // #B8955E
  muted: [248 / 255, 250 / 255, 252 / 255] as [number, number, number], // #f8fafc
  border: [232 / 255, 236 / 255, 241 / 255] as [number, number, number], // #e8ecf1
  text: [10 / 255, 22 / 255, 40 / 255] as [number, number, number],
  textMuted: [100 / 255, 116 / 255, 139 / 255] as [number, number, number],
};

const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  butik: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
  kontor: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  lager: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80",
  restaurang: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
  verkstad: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
  showroom: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80",
  popup: "https://images.unsplash.com/photo-1528698827591-e19cef791f48?w=600&q=80",
  atelje: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  ovrigt: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80",
};

export type PdfTemplate = 1 | 2 | 3 | 4 | 5;

export interface PdfListingInput extends Listing {
  nearby?: NearbyData;
  priceContext?: PriceContext | null;
  demographics?: DemographicsData | null;
  showWatermark?: boolean;
  /** Välj layout 1–5. Alla har samma röd tråd (färger, logo). */
  template?: PdfTemplate;
}

function formatPriceDisplay(price: number, type: string): string {
  if (type === "sale" && price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1).replace(".", ",")} mkr`;
  }
  return formatPrice(price, type);
}

async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n
  );
  return { x, y };
}

async function getStaticMapBase64(lat: number, lng: number): Promise<string | null> {
  const zoom = 15;
  const { x, y } = latLngToTile(lat, lng, zoom);
  try {
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    return await imageUrlToBase64(tileUrl);
  } catch {
    return null;
  }
}

function tryAddImage(doc: jsPDF, imgData: string | null, x: number, y: number, w: number, h: number): boolean {
  if (!imgData) return false;
  try {
    const fmt = imgData.startsWith("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(imgData, fmt, x, y, w, h, undefined, "FAST");
    return true;
  } catch {
    return false;
  }
}

/** Gemensam header med logo – röd tråd över alla templates */
function drawHeader(doc: jsPDF, logoData: string | null, margin: number) {
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, 0, PAGE_W, 10, "F");
  if (logoData) {
    tryAddImage(doc, logoData, margin, 2, 32, 6);
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(1, 1, 1);
    doc.text("HittaYta.se", margin, 6.5);
  }
}

/** Gemensam footer – röd tråd */
function drawFooter(doc: jsPDF, margin: number) {
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text("HittaYta.se · hittayta.se", margin, PAGE_H - 5);
}

/** Gold accent-streck – grafiskt element från site */
function drawGoldAccent(doc: jsPDF, x: number, y: number, w: number) {
  doc.setFillColor(COLORS.gold[0], COLORS.gold[1], COLORS.gold[2]);
  doc.roundedRect(x, y, w, 1.5, 0.5, 0.5, "F");
}

// ─── Template 1: Klassisk – hero, galleri 3 kolumner, beskrivning, kontakt ───
async function renderTemplate1(
  doc: jsPDF,
  listing: PdfListingInput,
  imageDataList: string[],
  logoData: string | null,
  listingUrl: string,
  baseUrl: string
) {
  const M = 12;
  const W = PAGE_W - M * 2;
  let y = 14;

  drawHeader(doc, logoData, M);

  // Titel
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.splitTextToSize(listing.title, W).slice(0, 2).forEach((line: string, i: number) => {
    doc.text(line, M, y + i * 5);
  });
  y += 12;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text([typeLabels[listing.type], formatCategories(listing.category), listing.city].join(" · "), M, y);
  drawGoldAccent(doc, M, y + 2, 30);
  y += 8;

  // Stats pills
  const stats = [
    { label: "Pris", value: formatPriceDisplay(listing.price, listing.type) },
    { label: "Yta", value: `${listing.size} m²` },
    { label: "kr/m²", value: listing.size > 0 ? `${Math.round(listing.price / listing.size).toLocaleString("sv-SE")}` : "—" },
  ];
  const pw = (W - 8) / 3;
  stats.forEach((s, i) => {
    const px = M + i * (pw + 4);
    doc.setFillColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.roundedRect(px, y, pw, 11, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.text(s.label, px + 4, y + 5);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text(s.value, px + 4, y + 9);
  });
  y += 16;

  // Bildgalleri 3 kolumner
  const COLS = 3;
  const GAP = 3;
  const imgCount = Math.min(imageDataList.length, 6);
  if (imgCount > 0) {
    const rows = Math.ceil(imgCount / COLS);
    const cw = (W - GAP * (COLS - 1)) / COLS;
    const ch = cw * 0.75;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        if (idx >= imgCount) break;
        const ix = M + c * (cw + GAP);
        const iy = y + r * (ch + GAP);
        if (!tryAddImage(doc, imageDataList[idx], ix, iy, cw, ch)) {
          doc.setFillColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
          doc.roundedRect(ix, iy, cw, ch, 2, 2, "F");
        }
      }
    }
    y += rows * (ch + GAP) + 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`${listing.address}, ${listing.city}`, M, y);
  y += 5;
  if (listing.tags?.length) {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.text(listing.tags.join(" · "), M, y);
    y += 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  const descLines = doc.splitTextToSize(listing.description || "—", W);
  descLines.slice(0, 6).forEach((l: string) => {
    doc.text(l, M, y);
    y += 4;
  });
  y += 6;

  // Kontakt + QR
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, y - 2, PAGE_W, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("Kontakt", M, y + 3);
  y += 6;

  doc.setFillColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.roundedRect(M, y, W - 26, 26, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  let cy = y + 6;
  if (listing.contact?.name) { doc.text(listing.contact.name, M + 6, cy); cy += 5; }
  if (listing.contact?.email) { doc.text(listing.contact.email, M + 6, cy); cy += 5; }
  if (listing.contact?.phone) doc.text(listing.contact.phone, M + 6, cy);

  try {
    const qr = await QRCode.toDataURL(listingUrl, { width: 100, margin: 1 });
    doc.addImage(qr, "PNG", PAGE_W - M - 22, y + 2, 20, 20);
    doc.setFontSize(6);
    doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
    doc.text("Skanna för mer", PAGE_W - M - 22, y + 26, { align: "center" });
  } catch { /* ignore */ }

  drawFooter(doc, M);
}

// ─── Template 2: Två kolumner – bilder vänster, text höger ───
async function renderTemplate2(
  doc: jsPDF,
  listing: PdfListingInput,
  imageDataList: string[],
  logoData: string | null,
  listingUrl: string
) {
  const M = 12;
  const colLeft = 0.45 * (PAGE_W - 2 * M);
  const colRight = 0.55 * (PAGE_W - 2 * M);
  let y = 14;

  drawHeader(doc, logoData, M);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.splitTextToSize(listing.title, colRight).slice(0, 3).forEach((l: string, i: number) => {
    doc.text(l, M + colLeft + 6, y + i * 5);
  });
  y += 18;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text([typeLabels[listing.type], formatCategories(listing.category), listing.city].join(" · "), M + colLeft + 6, y);
  y += 8;

  // Stats i högerkolumnen
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.gold[0], COLORS.gold[1], COLORS.gold[2]);
  doc.text(formatPriceDisplay(listing.price, listing.type), M + colLeft + 6, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`${listing.size} m² · ${listing.address}, ${listing.city}`, M + colLeft + 6, y);
  y += 8;

  // Beskrivning höger
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.splitTextToSize(listing.description || "—", colRight - 6).slice(0, 12).forEach((l: string) => {
    doc.text(l, M + colLeft + 6, y);
    y += 3.5;
  });
  y += 4;

  // Kontakt höger
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(M + colLeft + 6, y, colRight - 12, 22, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("Kontakt", M + colLeft + 12, y + 6);
  doc.setFont("helvetica", "normal");
  let cy = y + 11;
  if (listing.contact?.name) { doc.text(listing.contact.name, M + colLeft + 12, cy); cy += 4; }
  if (listing.contact?.email) doc.text(listing.contact.email, M + colLeft + 12, cy);

  // Bilder vänster
  const imgW = colLeft - 4;
  const imgH = imgW * 0.7;
  const imgCount = Math.min(imageDataList.length, 4);
  for (let i = 0; i < imgCount; i++) {
    const iy = 14 + i * (imgH + 4);
    if (!tryAddImage(doc, imageDataList[i], M, iy, imgW, imgH)) {
      doc.setFillColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.roundedRect(M, iy, imgW, imgH, 2, 2, "F");
    }
  }

  try {
    const qr = await QRCode.toDataURL(listingUrl, { width: 80, margin: 1 });
    doc.addImage(qr, "PNG", M + colLeft + colRight - 28, y + 2, 18, 18);
  } catch { /* ignore */ }

  drawFooter(doc, M);
}

// ─── Template 3: Editorial – stor hero, titel över bild, 2x2 galleri ───
async function renderTemplate3(
  doc: jsPDF,
  listing: PdfListingInput,
  imageDataList: string[],
  logoData: string | null,
  listingUrl: string
) {
  const M = 10;
  const W = PAGE_W - M * 2;
  let y = 12;

  drawHeader(doc, logoData, M);

  // Stor hero
  const heroH = 55;
  if (imageDataList[0]) {
    tryAddImage(doc, imageDataList[0], 0, y, PAGE_W, heroH);
  } else {
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.rect(0, y, PAGE_W, heroH, "F");
  }
  doc.setFillColor(0, 0, 0, 0.4);
  doc.rect(0, y + heroH - 22, PAGE_W, 22, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text(listing.title.slice(0, 60) + (listing.title.length > 60 ? "…" : ""), M, y + heroH - 6);
  y += heroH + 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text([typeLabels[listing.type], formatCategories(listing.category), listing.city].join(" · "), M, y);
  drawGoldAccent(doc, M, y + 2, 25);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.gold[0], COLORS.gold[1], COLORS.gold[2]);
  doc.text(formatPriceDisplay(listing.price, listing.type), M, y);
  y += 7;

  // 2x2 bildgalleri
  const G = 4;
  const cw = (W - G) / 2;
  const ch = cw * 0.7;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const idx = 1 + r * 2 + c;
      const ix = M + c * (cw + G);
      const iy = y + r * (ch + G);
      if (imageDataList[idx]) {
        tryAddImage(doc, imageDataList[idx], ix, iy, cw, ch);
      } else {
        doc.setFillColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
        doc.roundedRect(ix, iy, cw, ch, 2, 2, "F");
      }
    }
  }
  y += 2 * (ch + G) + 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`${listing.address}, ${listing.city}`, M, y);
  y += 5;
  doc.splitTextToSize(listing.description || "—", W).slice(0, 5).forEach((l: string) => {
    doc.text(l, M, y);
    y += 4;
  });
  y += 6;

  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(M, y, W, 28, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("Kontakt", M + 8, y + 7);
  doc.setFont("helvetica", "normal");
  let cy = y + 13;
  if (listing.contact?.name) { doc.text(listing.contact.name, M + 8, cy); cy += 5; }
  if (listing.contact?.email) { doc.text(listing.contact.email, M + 8, cy); }

  try {
    const qr = await QRCode.toDataURL(listingUrl, { width: 100, margin: 1 });
    doc.addImage(qr, "PNG", PAGE_W - M - 26, y + 4, 22, 22);
    doc.setFontSize(6);
    doc.setTextColor(0.9, 0.9, 0.9);
    doc.text("Skanna för mer", PAGE_W - M - 26, y + 28, { align: "center" });
  } catch { /* ignore */ }

  drawFooter(doc, M);
}

// ─── Template 4: Kompakt – allt på en sida, tät layout ───
async function renderTemplate4(
  doc: jsPDF,
  listing: PdfListingInput,
  imageDataList: string[],
  logoData: string | null,
  listingUrl: string
) {
  const M = 10;
  const W = PAGE_W - M * 2;
  let y = 12;

  drawHeader(doc, logoData, M);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.splitTextToSize(listing.title, W).slice(0, 2).forEach((l: string, i: number) => {
    doc.text(l, M, y + i * 4);
  });
  y += 12;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text([typeLabels[listing.type], formatCategories(listing.category), listing.city].join(" · "), M, y);
  y += 5;

  // Kompakta stats + bilder 4 kolumner
  const COLS = 4;
  const GAP = 2;
  const cw = (W - GAP * (COLS - 1)) / COLS;
  const ch = cw * 0.65;
  const imgCount = Math.min(imageDataList.length, 4);
  for (let i = 0; i < imgCount; i++) {
    const ix = M + i * (cw + GAP);
    if (!tryAddImage(doc, imageDataList[i], ix, y, cw, ch)) {
      doc.setFillColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.roundedRect(ix, y, cw, ch, 1, 1, "F");
    }
  }
  y += ch + 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.gold[0], COLORS.gold[1], COLORS.gold[2]);
  doc.text(formatPriceDisplay(listing.price, listing.type), M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`  ${listing.size} m² · ${listing.address}`, M + 28, y);
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.splitTextToSize(listing.description || "—", W).slice(0, 10).forEach((l: string) => {
    doc.text(l, M, y);
    y += 3;
  });
  y += 4;

  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(M, y, W, 20, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("Kontakt", M + 6, y + 5);
  doc.setFont("helvetica", "normal");
  let cy = y + 10;
  if (listing.contact?.name) { doc.text(listing.contact.name, M + 6, cy); cy += 4; }
  if (listing.contact?.email) doc.text(listing.contact.email, M + 6, cy);

  try {
    const qr = await QRCode.toDataURL(listingUrl, { width: 80, margin: 1 });
    doc.addImage(qr, "PNG", PAGE_W - M - 20, y + 2, 18, 18);
  } catch { /* ignore */ }

  drawFooter(doc, M);
}

// ─── Template 5: Premium – luftig, guldaccenter ───
async function renderTemplate5(
  doc: jsPDF,
  listing: PdfListingInput,
  imageDataList: string[],
  logoData: string | null,
  listingUrl: string
) {
  const M = 16;
  const W = PAGE_W - M * 2;
  let y = 16;

  drawHeader(doc, logoData, M);

  drawGoldAccent(doc, M, y, 40);
  y += 6;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.splitTextToSize(listing.title, W).slice(0, 2).forEach((l: string, i: number) => {
    doc.text(l, M, y + i * 6);
  });
  y += 18;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text([typeLabels[listing.type], formatCategories(listing.category), listing.city].join(" · "), M, y);
  y += 10;

  doc.setFillColor(COLORS.gold[0], COLORS.gold[1], COLORS.gold[2]);
  doc.roundedRect(M, y, 50, 14, 2, 2, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.text(formatPriceDisplay(listing.price, listing.type), M + 8, y + 9);
  y += 20;

  // Bilder 3 kolumner, luftigare
  const COLS = 3;
  const GAP = 5;
  const cw = (W - GAP * (COLS - 1)) / COLS;
  const ch = cw * 0.75;
  const imgCount = Math.min(imageDataList.length, 6);
  if (imgCount > 0) {
    const rows = Math.ceil(imgCount / COLS);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = r * COLS + c;
        if (idx >= imgCount) break;
        const ix = M + c * (cw + GAP);
        const iy = y + r * (ch + GAP);
        if (!tryAddImage(doc, imageDataList[idx], ix, iy, cw, ch)) {
          doc.setFillColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
          doc.roundedRect(ix, iy, cw, ch, 3, 3, "F");
        }
      }
    }
    y += rows * (ch + GAP) + 10;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`${listing.address}, ${listing.city}`, M, y);
  y += 6;
  doc.splitTextToSize(listing.description || "—", W).slice(0, 6).forEach((l: string) => {
    doc.text(l, M, y);
    y += 4;
  });
  y += 10;

  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.roundedRect(M, y, W, 30, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("Kontakt", M + 10, y + 8);
  doc.setFont("helvetica", "normal");
  let cy = y + 14;
  if (listing.contact?.name) { doc.text(listing.contact.name, M + 10, cy); cy += 5; }
  if (listing.contact?.email) { doc.text(listing.contact.email, M + 10, cy); }

  try {
    const qr = await QRCode.toDataURL(listingUrl, { width: 120, margin: 1 });
    doc.addImage(qr, "PNG", PAGE_W - M - 28, y + 3, 26, 26);
    doc.setFontSize(7);
    doc.setTextColor(0.9, 0.9, 0.9);
    doc.text("Skanna för mer", PAGE_W - M - 28, y + 32, { align: "center" });
  } catch { /* ignore */ }

  drawFooter(doc, M);
}

export async function generateListingPdfBlob(input: PdfListingInput): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const listing = input;
  doc.setProperties({
    title: listing.title,
    subject: `Kommersiell lokal – ${listing.address}, ${listing.city}`,
    author: listing.contact?.name || "HittaYta.se",
    creator: "HittaYta.se",
  });

  const template: PdfTemplate = input.template ?? 1;
  const primaryCategory = parseCategories(listing.category)[0] ?? "ovrigt";
  const placeholderUrl = UNSPLASH_BY_CATEGORY[primaryCategory] ?? UNSPLASH_BY_CATEGORY.ovrigt;

  const images = getListingImages(listing);
  const imageDataList: string[] = [];
  for (const url of images.slice(0, 6)) {
    const data = await imageUrlToBase64(url);
    if (data) imageDataList.push(data);
  }
  if (imageDataList.length === 0) {
    const fallback = await imageUrlToBase64(placeholderUrl);
    if (fallback) imageDataList.push(fallback);
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://hittayta.se";
  const listingUrl = listing.id.startsWith("pdf-") ? baseUrl : `${baseUrl}/annonser/${listing.id}`;

  let logoData: string | null = null;
  try {
    logoData = await imageUrlToBase64(`${baseUrl}/HYlogo.png`);
  } catch { /* ignore */ }

  switch (template) {
    case 1:
      await renderTemplate1(doc, listing, imageDataList, logoData, listingUrl, baseUrl);
      break;
    case 2:
      await renderTemplate2(doc, listing, imageDataList, logoData, listingUrl);
      break;
    case 3:
      await renderTemplate3(doc, listing, imageDataList, logoData, listingUrl);
      break;
    case 4:
      await renderTemplate4(doc, listing, imageDataList, logoData, listingUrl);
      break;
    case 5:
      await renderTemplate5(doc, listing, imageDataList, logoData, listingUrl);
      break;
    default:
      await renderTemplate1(doc, listing, imageDataList, logoData, listingUrl, baseUrl);
  }

  return doc.output("blob");
}

export async function downloadListingPdf(listing: PdfListingInput, template?: PdfTemplate): Promise<void> {
  const blob = await generateListingPdfBlob({ ...listing, template: template ?? listing.template ?? 1 });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `annons-${listing.id.slice(0, 8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
