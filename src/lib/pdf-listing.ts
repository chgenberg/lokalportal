"use client";

import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Listing } from "@/lib/types";
import { categoryLabels, typeLabels } from "@/lib/types";

const MARGIN = 20;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_HEIGHT = 5.5;
const SECTION_GAP = 8;
const FONT_TITLE = 20;
const FONT_HEADING = 11;
const FONT_BODY = 10;
const FONT_SMALL = 9;
const COLOR_TITLE = [0.1, 0.15, 0.27]; // navy
const COLOR_NAVY = [0.1, 0.15, 0.27];
const COLOR_MUTED = [0.45, 0.45, 0.5];

function formatPrice(price: number, type: string): string {
  if (type === "sale") return `${(price / 1_000_000).toFixed(1)} mkr`;
  return `${price.toLocaleString("sv-SE")} kr/mån`;
}

export async function downloadListingPdf(listing: Listing): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  // Header branding
  doc.setFillColor(COLOR_NAVY[0] * 255, COLOR_NAVY[1] * 255, COLOR_NAVY[2] * 255);
  doc.rect(0, 0, PAGE_W, 14, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(1, 1, 1);
  doc.text("HittaYta.se", MARGIN, 10);
  y = 20;

  const addSection = (title: string, content: string, options?: { lineHeight?: number }) => {
    const lh = options?.lineHeight ?? LINE_HEIGHT;
    if (y > 250) {
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
      if (y > 275) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += lh;
    });
    y += SECTION_GAP;
  };

  // Title
  doc.setFontSize(FONT_TITLE);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_TITLE[0], COLOR_TITLE[1], COLOR_TITLE[2]);
  const titleLines = doc.splitTextToSize(listing.title, CONTENT_W);
  titleLines.forEach((line: string) => {
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT + 1.5;
  });
  y += 4;

  // Meta line
  doc.setFontSize(FONT_SMALL);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const meta = [
    typeLabels[listing.type] ?? listing.type,
    categoryLabels[listing.category] ?? listing.category,
    formatPrice(listing.price, listing.type),
    `${listing.size} m²`,
    listing.city,
  ].join("  ·  ");
  doc.text(meta, MARGIN, y);
  y += SECTION_GAP + 3;

  doc.setDrawColor(0.9, 0.9, 0.92);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += SECTION_GAP + 3;

  addSection("Adress", `${listing.address}, ${listing.city}`);
  addSection("Beskrivning", listing.description || "—", { lineHeight: LINE_HEIGHT + 0.5 });

  if (listing.tags?.length) {
    if (y > 255) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(FONT_HEADING);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text("Egenskaper", MARGIN, y);
    y += 5;
    doc.line(MARGIN, y - 1, MARGIN + 30, y - 1);
    y += 4;
    doc.setFontSize(FONT_BODY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0.2, 0.2, 0.25);
    doc.text(listing.tags.join(", "), MARGIN, y);
    y += LINE_HEIGHT + SECTION_GAP;
  }

  addSection("Kontakt", [
    listing.contact?.name ? `Namn: ${listing.contact.name}` : "",
    listing.contact?.email ? `E-post: ${listing.contact.email}` : "",
    listing.contact?.phone ? `Telefon: ${listing.contact.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n"));

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://hittayta.se";
  const listingUrl = listing.id.startsWith("pdf-") ? baseUrl : `${baseUrl}/annonser/${listing.id}`;

  // QR code
  try {
    const qrDataUrl = await QRCode.toDataURL(listingUrl, { width: 180, margin: 1 });
    const qrSize = 22;
    doc.addImage(qrDataUrl, "PNG", PAGE_W - MARGIN - qrSize, 272, qrSize, qrSize);
  } catch {
    // ignore QR errors
  }

  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("HittaYta.se", MARGIN, 288);
  doc.text(listingUrl, MARGIN, 292);

  doc.save(`annons-${listing.id.slice(0, 8)}.pdf`);
}
