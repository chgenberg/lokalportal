"use client";

import { jsPDF } from "jspdf";
import type { Listing } from "@/lib/types";
import { categoryLabels, typeLabels } from "@/lib/types";

const MARGIN = 20;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_HEIGHT = 5.5;
const SECTION_GAP = 6;
const FONT_TITLE = 18;
const FONT_HEADING = 10;
const FONT_BODY = 10;
const FONT_SMALL = 9;
const COLOR_TITLE = [0.13, 0.15, 0.2];
const COLOR_MUTED = [0.45, 0.45, 0.5];

function formatPrice(price: number, type: string): string {
  if (type === "sale") return `${(price / 1_000_000).toFixed(1)} mkr`;
  return `${price.toLocaleString("sv-SE")} kr/mån`;
}

export function downloadListingPdf(listing: Listing): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const addSection = (title: string, content: string, options?: { lineHeight?: number }) => {
    const lh = options?.lineHeight ?? LINE_HEIGHT;
    if (y > 250) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(FONT_HEADING);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(title, MARGIN, y);
    y += 4;
    doc.setFontSize(FONT_BODY);
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
    y += LINE_HEIGHT + 1;
  });
  y += 2;

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
  y += SECTION_GAP + 2;

  // Line
  doc.setDrawColor(0.9, 0.9, 0.92);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += SECTION_GAP + 2;

  addSection("Adress", `${listing.address}, ${listing.city}`);
  addSection("Beskrivning", listing.description || "—", { lineHeight: LINE_HEIGHT + 0.5 });

  if (listing.tags?.length) {
    if (y > 255) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(FONT_HEADING);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text("Egenskaper", MARGIN, y);
    y += 4;
    doc.setFontSize(FONT_BODY);
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

  // Footer
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://hittayta.se";
  const listingUrl = `${baseUrl}/annonser/${listing.id}`;
  doc.setFontSize(FONT_SMALL);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("HittaYta.se", MARGIN, 288);
  doc.text(listingUrl, MARGIN, 292);

  doc.save(`annons-${listing.id.slice(0, 8)}.pdf`);
}
