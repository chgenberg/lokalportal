"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Listing } from "@/lib/types";
import type { NearbyData, PriceContext, DemographicsData } from "@/lib/types";
import { formatCategories, typeLabels, categoryLabels, parseCategories } from "@/lib/types";
import { formatPrice } from "@/lib/formatPrice";

const MARGIN = 20;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_HEIGHT = 5.5;
const SECTION_GAP = 8;
const FONT_TITLE = 20;
const FONT_HEADING = 11;
const FONT_BODY = 10;
const FONT_SMALL = 9;
const COLOR_NAVY = [0.1, 0.15, 0.27] as [number, number, number];
const COLOR_MUTED = [0.45, 0.45, 0.5] as [number, number, number];

const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  butik: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  kontor: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  lager: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
  restaurang: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  verkstad: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
  showroom: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
  popup: "https://images.unsplash.com/photo-1528698827591-e19cef791f48?w=800&q=80",
  atelje: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  ovrigt: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
};

export interface PdfListingInput extends Listing {
  nearby?: NearbyData;
  priceContext?: PriceContext | null;
  demographics?: DemographicsData | null;
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
    const blob = await res.blob();
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

function drawStatBox(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number
): void {
  doc.setDrawColor(0.9, 0.9, 0.94);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, 18, "S");
  doc.setFontSize(FONT_SMALL);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(label, x + 3, y + 6);
  doc.setFontSize(FONT_BODY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  const valLines = doc.splitTextToSize(value, w - 6);
  doc.text(valLines[0] ?? value, x + 3, y + 13);
}

function drawSection(
  doc: jsPDF,
  title: string,
  content: string,
  y: number,
  maxY: number
): number {
  if (y > maxY) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFontSize(FONT_HEADING);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text(title, MARGIN, y);
  y += 5;
  doc.setDrawColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y - 1, MARGIN + 30, y - 1);
  y += 4;
  doc.setFontSize(FONT_BODY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0.2, 0.2, 0.25);
  const lines = doc.splitTextToSize(content, CONTENT_W);
  lines.forEach((line: string) => {
    if (y > maxY) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT + 0.5;
  });
  return y + SECTION_GAP;
}

function drawDataTable(
  doc: jsPDF,
  leftRows: [string, string][],
  rightRows: [string, string][],
  x: number,
  y: number
): number {
  const colW = CONTENT_W / 2 - 4;
  doc.setFontSize(FONT_SMALL);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Faciliteter", x, y);
  doc.text("Kommunikation", x + colW + 8, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0.2, 0.2, 0.25);
  const maxRows = Math.max(leftRows.length, rightRows.length);
  for (let i = 0; i < maxRows; i++) {
    const left = leftRows[i];
    const right = rightRows[i];
    if (left) doc.text(`${left[0]}: ${left[1]}`, x, y);
    if (right) doc.text(`${right[0]}: ${right[1]}`, x + colW + 8, y);
    y += 5;
  }
  return y + SECTION_GAP;
}

export async function downloadListingPdf(listing: PdfListingInput): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const input = listing as PdfListingInput;
  const nearby = input.nearby;
  const priceContext = input.priceContext ?? null;
  const demographics = input.demographics ?? null;

  const primaryCategory = parseCategories(listing.category)[0] ?? "ovrigt";
  const placeholderUrl = UNSPLASH_BY_CATEGORY[primaryCategory] ?? UNSPLASH_BY_CATEGORY.ovrigt;

  // --- PAGE 1: COVER ---
  // Header branding (top)
  doc.setFillColor(COLOR_NAVY[0] * 255, COLOR_NAVY[1] * 255, COLOR_NAVY[2] * 255);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("HittaYta.se", MARGIN, 10);

  let y = 18;

  // Image or placeholder
  const imgHeight = 70;
  let imgData: string | null = null;
  if (listing.imageUrl?.trim()) {
    imgData = await imageUrlToBase64(listing.imageUrl);
  }
  if (!imgData) {
    imgData = await imageUrlToBase64(placeholderUrl);
  }
  if (imgData) {
    try {
      doc.addImage(imgData, "JPEG", MARGIN, y, CONTENT_W, imgHeight, undefined, "FAST");
    } catch {
      doc.setFillColor(COLOR_NAVY[0] * 255, COLOR_NAVY[1] * 255, COLOR_NAVY[2] * 255);
      doc.rect(MARGIN, y, CONTENT_W, imgHeight, "F");
      doc.setFontSize(FONT_HEADING);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(1, 1, 1);
      doc.text(categoryLabels[primaryCategory] ?? primaryCategory, MARGIN + CONTENT_W / 2 - 20, y + imgHeight / 2);
    }
  } else {
    doc.setFillColor(COLOR_NAVY[0] * 255, COLOR_NAVY[1] * 255, COLOR_NAVY[2] * 255);
    doc.rect(MARGIN, y, CONTENT_W, imgHeight, "F");
    doc.setFontSize(FONT_HEADING);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(1, 1, 1);
    doc.text(categoryLabels[primaryCategory] ?? primaryCategory, MARGIN + CONTENT_W / 2 - 20, y + imgHeight / 2);
  }
  y = y + imgHeight + SECTION_GAP;

  // Title
  doc.setFontSize(FONT_TITLE);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  const titleLines = doc.splitTextToSize(listing.title, CONTENT_W);
  titleLines.forEach((line: string) => {
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT + 1.5;
  });
  y += 2;

  // Meta: Typ · Kategori · Stad
  doc.setFontSize(FONT_SMALL);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(
    [typeLabels[listing.type], formatCategories(listing.category), listing.city].join("  ·  "),
    MARGIN,
    y
  );
  y += SECTION_GAP + 4;

  // Stat boxes: Pris, Yta, Adress
  const boxW = (CONTENT_W - 8) / 3;
  drawStatBox(doc, "Pris", formatPriceDisplay(listing.price, listing.type), MARGIN, y, boxW);
  drawStatBox(doc, "Yta", `${listing.size} m²`, MARGIN + boxW + 4, y, boxW);
  const addrShort = listing.address.length > 18 ? listing.address.slice(0, 15) + "…" : listing.address;
  drawStatBox(doc, "Adress", addrShort, MARGIN + (boxW + 4) * 2, y, boxW);
  y += 22;

  // Tags
  if (listing.tags?.length) {
    doc.setFontSize(FONT_HEADING);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text("Egenskaper", MARGIN, y);
    y += 5;
    doc.setFontSize(FONT_BODY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0.2, 0.2, 0.25);
    doc.text(listing.tags.join(", "), MARGIN, y);
    y += LINE_HEIGHT + SECTION_GAP;
  }

  doc.text("HittaYta.se", MARGIN, PAGE_H - 10);

  // --- PAGE 2: BESKRIVNING + OMRÅDESANALYS ---
  doc.addPage();
  y = MARGIN;

  y = drawSection(doc, "Om lokalen", listing.description || "—", y, 250);

  if (nearby || demographics || priceContext) {
    if (y > 240) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(FONT_HEADING);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text("Områdesanalys", MARGIN, y);
    y += 8;

    const leftRows: [string, string][] = [];
    const rightRows: [string, string][] = [];
    if (nearby) {
      if (nearby.restaurants > 0) leftRows.push(["Restauranger/caféer", String(nearby.restaurants)]);
      if (nearby.shops > 0) leftRows.push(["Butiker", String(nearby.shops)]);
      if (nearby.gyms > 0) leftRows.push(["Gym", String(nearby.gyms)]);
      if (nearby.schools > 0) leftRows.push(["Skolor", String(nearby.schools)]);
      if (nearby.healthcare > 0) leftRows.push(["Vård/apotek", String(nearby.healthcare)]);
      if (nearby.busStops.count > 0) rightRows.push(["Busshållplatser", String(nearby.busStops.count)]);
      if (nearby.trainStations.count > 0) rightRows.push(["Tågstationer", String(nearby.trainStations.count)]);
      if (nearby.parking > 0) rightRows.push(["Parkeringar", String(nearby.parking)]);
    }
    if (leftRows.length || rightRows.length) {
      y = drawDataTable(doc, leftRows, rightRows, MARGIN, y);
    }

    if (demographics && y < 250) {
      doc.setFontSize(FONT_HEADING);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text("Demografi & ekonomi", MARGIN, y);
      y += 5;
      doc.setDrawColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y - 1, MARGIN + 30, y - 1);
      y += 4;

      doc.setFontSize(FONT_BODY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0.2, 0.2, 0.25);
      doc.text(
        `${demographics.city} har cirka ${demographics.population.toLocaleString("sv-SE")} invånare (2024).`,
        MARGIN,
        y
      );
      y += LINE_HEIGHT + 1;

      if (demographics.medianIncome) {
        doc.text(`Medianinkomst: ${demographics.medianIncome} tkr/år`, MARGIN, y);
        y += LINE_HEIGHT + 1;
      }
      if (demographics.workingAgePercent) {
        doc.text(`Andel i arbetsför ålder (20–64): ${demographics.workingAgePercent}%`, MARGIN, y);
        y += LINE_HEIGHT + 1;
      }
      if (demographics.totalBusinesses) {
        doc.text(
          `Registrerade företag: ${demographics.totalBusinesses.toLocaleString("sv-SE")}`,
          MARGIN,
          y
        );
        y += LINE_HEIGHT + 1;
      }
      if (demographics.crimeRate) {
        doc.text(
          `Anmälda brott per 100 000 inv.: ${demographics.crimeRate.toLocaleString("sv-SE")} (BRÅ 2024)`,
          MARGIN,
          y
        );
        y += LINE_HEIGHT + 1;
      }
      y += SECTION_GAP - 2;
    }

    if (priceContext && priceContext.count >= 2 && y < 270) {
      doc.setFontSize(FONT_HEADING);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
      doc.text("Marknadsjämförelse", MARGIN, y);
      y += 5;
      doc.setFontSize(FONT_BODY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0.2, 0.2, 0.25);
      const priceSuffix = listing.type === "rent" ? " kr/mån" : " kr";
      doc.text(
        `Medianpris i ${listing.city}: ${priceContext.medianPrice.toLocaleString("sv-SE")}${priceSuffix}`,
        MARGIN,
        y
      );
      y += LINE_HEIGHT;
      doc.text(`Antal aktiva annonser: ${priceContext.count}`, MARGIN, y);
      y += LINE_HEIGHT;
      doc.text(
        `Prisspann: ${priceContext.minPrice.toLocaleString("sv-SE")}–${priceContext.maxPrice.toLocaleString("sv-SE")}${priceSuffix}`,
        MARGIN,
        y
      );
      y += SECTION_GAP;
    }
  }

  // --- PAGE 3: KONTAKT + QR ---
  doc.addPage();
  y = MARGIN;

  doc.setFontSize(FONT_HEADING);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Kontakt", MARGIN, y);
  y += 8;
  doc.setFontSize(FONT_BODY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0.2, 0.2, 0.25);
  const contactLines = [
    listing.contact?.name ? `Namn: ${listing.contact.name}` : "",
    listing.contact?.email ? `E-post: ${listing.contact.email}` : "",
    listing.contact?.phone ? `Telefon: ${listing.contact.phone}` : "",
  ].filter(Boolean);
  contactLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT;
  });
  y += SECTION_GAP;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://hittayta.se";
  const listingUrl = listing.id.startsWith("pdf-") ? baseUrl : `${baseUrl}/annonser/${listing.id}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(listingUrl, { width: 180, margin: 1 });
    const qrSize = 22;
    doc.addImage(qrDataUrl, "PNG", MARGIN, y, qrSize, qrSize);
    doc.setFontSize(FONT_SMALL);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text("Skanna för att se mer", MARGIN + qrSize + 6, y + qrSize / 2 + 2);
  } catch {
    // ignore QR errors
  }

  y = PAGE_H - 20;
  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("Genererad med HittaYta.se", MARGIN, y);
  doc.text("hittayta.se", MARGIN, y + 5);

  doc.save(`annons-${listing.id.slice(0, 8)}.pdf`);
}
