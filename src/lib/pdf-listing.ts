"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Listing } from "@/lib/types";
import type { NearbyData, PriceContext, DemographicsData } from "@/lib/types";
import { formatCategories, typeLabels, categoryLabels, parseCategories, getListingImages } from "@/lib/types";
import { formatPrice } from "@/lib/formatPrice";

const MARGIN = 18;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Modern, minimalist color palette
const COLORS = {
  navy: [0.09, 0.18, 0.31] as [number, number, number],
  navyLight: [0.12, 0.28, 0.45] as [number, number, number],
  accent: [0.25, 0.5, 0.8] as [number, number, number],
  muted: [0.45, 0.48, 0.55] as [number, number, number],
  text: [0.18, 0.2, 0.25] as [number, number, number],
  bg: [0.97, 0.97, 0.98] as [number, number, number],
  white: [1, 1, 1] as [number, number, number],
};

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
  showWatermark?: boolean;
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

/** Draw a minimal horizontal bar chart */
function drawBarChart(
  doc: jsPDF,
  items: { label: string; value: number }[],
  x: number,
  y: number,
  chartWidth: number,
  barHeight: number,
  maxValue: number
): number {
  const labelWidth = 38;
  const barStart = x + labelWidth;
  const barMaxW = chartWidth - labelWidth - 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  for (const item of items) {
    if (item.value === 0) {
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text(item.label, x, y + barHeight / 2 + 1);
      doc.text("—", barStart + barMaxW - 4, y + barHeight / 2 + 1, { align: "right" });
    } else {
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(item.label, x, y + barHeight / 2 + 1);

      const barW = maxValue > 0 ? (item.value / maxValue) * barMaxW : 0;
      doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.roundedRect(barStart, y, barW, barHeight - 0.5, 1, 1, "F");

      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(String(item.value), barStart + barMaxW + 4, y + barHeight / 2 + 1);
    }
    y += barHeight + 1.5;
  }
  return y;
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
  const nearby = input.nearby;
  const priceContext = input.priceContext ?? null;
  const demographics = input.demographics ?? null;

  const primaryCategory = parseCategories(listing.category)[0] ?? "ovrigt";
  const placeholderUrl = UNSPLASH_BY_CATEGORY[primaryCategory] ?? UNSPLASH_BY_CATEGORY.ovrigt;

  // ─── PAGE 1: COVER (minimalist, professional) ───
  const imgHeight = 85;
  let imgData: string | null = null;
  const primaryImage = getListingImages(listing)[0];
  if (primaryImage) {
    imgData = await imageUrlToBase64(primaryImage);
  }
  if (!imgData) {
    imgData = await imageUrlToBase64(placeholderUrl);
  }

  // Hero image – full width (header bar drawn on top)
  if (imgData) {
    try {
      doc.addImage(imgData, "JPEG", 0, 12, PAGE_W, imgHeight - 12, undefined, "FAST");
    } catch {
      doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
      doc.rect(0, 12, PAGE_W, imgHeight - 12, "F");
    }
  } else {
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.rect(0, 12, PAGE_W, imgHeight - 12, "F");
  }

  // Minimal header bar (always on top)
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, 0, PAGE_W, 12, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("HittaYta.se", MARGIN, 8.5);

  // Title over image (white, bottom of image area)
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  const titleLines = doc.splitTextToSize(listing.title, PAGE_W - MARGIN * 2);
  const titleY = imgHeight - 8 - (titleLines.length - 1) * 6;
  titleLines.forEach((line: string) => {
    doc.text(line, MARGIN, titleY + (titleLines.indexOf(line) * 6));
  });

  let y = imgHeight + 14;

  // Meta pills – typ, kategori, stad
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text(
    [typeLabels[listing.type], formatCategories(listing.category), listing.city].join("  ·  "),
    MARGIN,
    y
  );
  y += 12;

  // Stats row – minimal cards
  const statItems = [
    { label: "Pris", value: formatPriceDisplay(listing.price, listing.type) },
    {
      label: "Yta",
      value: `${listing.size} m²`,
    },
    {
      label: "kr/m²",
      value:
        listing.size > 0
          ? Math.round(listing.price / listing.size).toLocaleString("sv-SE") +
            (listing.type === "rent" ? " kr/m²" : " kr/m²")
          : "—",
    },
  ];
  const statW = (CONTENT_W - 8) / 3;
  doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
  statItems.forEach((s, i) => {
    const sx = MARGIN + i * (statW + 4);
    doc.roundedRect(sx, y, statW, 22, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(s.label, sx + 6, y + 8);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.text(s.value, sx + 6, y + 17);
  });
  y += 30;

  // Address
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`${listing.address}, ${listing.city}`, MARGIN, y);
  y += 8;

  // Tags
  if (listing.tags?.length) {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(listing.tags.join(" · "), MARGIN, y);
    y += 10;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("HittaYta.se", MARGIN, PAGE_H - 8);

  // ─── PAGE 2: BESKRIVNING + OMRÅDESANALYS + DIAGRAM ───
  doc.addPage();
  y = MARGIN;

  // Beskrivning
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("Om lokalen", MARGIN, 10);
  y = 22;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  const descLines = doc.splitTextToSize(listing.description || "—", CONTENT_W);
  descLines.forEach((line: string) => {
    doc.text(line, MARGIN, y);
    y += 5.5;
  });
  y += 14;

  // Områdesanalys – med diagram
  const hasAreaData = nearby || demographics || priceContext;
  if (hasAreaData) {
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.rect(0, y - 6, PAGE_W, 14, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(1, 1, 1);
    doc.text("Områdesanalys", MARGIN, y + 2);
    y += 16;

    // Faciliteter – bar chart
    if (nearby) {
      const amenityItems = [
        { label: "Restauranger", value: nearby.restaurants },
        { label: "Butiker", value: nearby.shops },
        { label: "Skolor", value: nearby.schools },
        { label: "Gym", value: nearby.gyms },
        { label: "Vård/Apotek", value: nearby.healthcare },
        { label: "Busshållpl.", value: nearby.busStops.count },
        { label: "Tågstationer", value: nearby.trainStations.count },
        { label: "Parkeringar", value: nearby.parking },
      ].filter((i) => i.value >= 0);
      const maxAmenity = Math.max(1, ...amenityItems.map((i) => i.value));
      if (amenityItems.length) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
        doc.text("Faciliteter inom 2,5 km", MARGIN, y);
        y += 6;
        y = drawBarChart(doc, amenityItems, MARGIN, y, CONTENT_W, 5, maxAmenity);
        y += 8;
      }
    }

    // Demografi – bar chart (om vi har data)
    if (demographics && y < 200) {
      const demoItems: { label: string; value: number }[] = [];
      if (demographics.population) {
        demoItems.push({ label: "Invånare (tusen)", value: Math.round(demographics.population / 1000) });
      }
      if (demographics.medianIncome) {
        demoItems.push({ label: "Medianinkomst (tkr)", value: demographics.medianIncome });
      }
      if (demographics.workingAgePercent) {
        demoItems.push({ label: "Arbetsför ålder %", value: demographics.workingAgePercent });
      }
      if (demographics.totalBusinesses) {
        const biz = demographics.totalBusinesses;
        demoItems.push({
          label: "Företag (hundratal)",
          value: biz >= 1000 ? Math.round(biz / 100) : Math.round(biz / 10),
        });
      }
      const maxDemo = Math.max(1, ...demoItems.map((i) => i.value));
      if (demoItems.length) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
        doc.text("Demografi & ekonomi", MARGIN, y);
        y += 6;
        y = drawBarChart(doc, demoItems, MARGIN, y, CONTENT_W, 5, maxDemo);
        y += 6;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
        doc.text(
          `${demographics.city} – Invånare: ${demographics.population.toLocaleString("sv-SE")}.${demographics.crimeRate ? ` Brott/100k inv: ${demographics.crimeRate.toLocaleString("sv-SE")} (BRÅ).` : ""}`,
          MARGIN,
          y,
          { maxWidth: CONTENT_W }
        );
        y += 10;
      }
    }

    // Marknadsjämförelse
    if (priceContext && priceContext.count >= 2 && y < 250) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
      doc.text("Marknadsjämförelse", MARGIN, y);
      y += 6;
      const priceSuffix = listing.type === "rent" ? " kr/mån" : " kr";
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(`Medianpris i ${listing.city}: ${priceContext.medianPrice.toLocaleString("sv-SE")}${priceSuffix}`, MARGIN, y);
      y += 5;
      doc.text(`Antal annonser: ${priceContext.count}  ·  Spann: ${priceContext.minPrice.toLocaleString("sv-SE")}–${priceContext.maxPrice.toLocaleString("sv-SE")}${priceSuffix}`, MARGIN, y);
      y += 12;
    }
  }

  // Plats – kartbild
  const hasCoords = listing.lat != null && listing.lng != null && !Number.isNaN(listing.lat) && !Number.isNaN(listing.lng);
  if (hasCoords && y < 230) {
    doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
    doc.rect(0, y - 6, PAGE_W, 14, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(1, 1, 1);
    doc.text("Plats", MARGIN, y + 2);
    y += 14;
    const mapData = await getStaticMapBase64(listing.lat, listing.lng);
    if (mapData) {
      const mapH = 48;
      try {
        doc.addImage(mapData, "PNG", MARGIN, y, CONTENT_W, mapH, undefined, "FAST");
      } catch {
        /* ignore */
      }
      y += mapH + 6;
      doc.setFontSize(7);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text("© OpenStreetMap", MARGIN, y);
      y += 8;
    }
  }

  // ─── PAGE 3: KONTAKT + QR ───
  doc.addPage();
  doc.setFillColor(COLORS.navy[0], COLORS.navy[1], COLORS.navy[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H);
  doc.setFillColor(COLORS.navyLight[0], COLORS.navyLight[1], COLORS.navyLight[2]);
  doc.roundedRect(MARGIN, 40, CONTENT_W, 100, 4, 4, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("Kontakt", MARGIN + 12, 58);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(1, 1, 1);
  let cy = 72;
  if (listing.contact?.name) {
    doc.text(listing.contact.name, MARGIN + 12, cy);
    cy += 8;
  }
  if (listing.contact?.email) {
    doc.text(listing.contact.email, MARGIN + 12, cy);
    cy += 8;
  }
  if (listing.contact?.phone) {
    doc.text(listing.contact.phone, MARGIN + 12, cy);
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://hittayta.se";
  const listingUrl = listing.id.startsWith("pdf-") ? baseUrl : `${baseUrl}/annonser/${listing.id}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(listingUrl, { width: 200, margin: 1 });
    const qrSize = 28;
    doc.addImage(qrDataUrl, "PNG", PAGE_W - MARGIN - qrSize - 12, 52, qrSize, qrSize);
    doc.setFontSize(9);
    doc.setTextColor(0.85, 0.88, 0.92);
    doc.text("Skanna för mer info", PAGE_W - MARGIN - qrSize - 12, 52 + qrSize + 6, { align: "center" });
  } catch {
    /* ignore */
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("HittaYta.se", MARGIN, PAGE_H - 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0.7, 0.75, 0.85);
  doc.text("hittayta.se", MARGIN, PAGE_H - 22);

  return doc.output("blob");
}

export async function downloadListingPdf(listing: PdfListingInput): Promise<void> {
  const blob = await generateListingPdfBlob(listing);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `annons-${listing.id.slice(0, 8)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
