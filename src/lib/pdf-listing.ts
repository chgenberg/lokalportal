"use client";

import type { Listing } from "@/lib/types";
import type { NearbyData, PriceContext, DemographicsData } from "@/lib/types";

export interface PdfListingInput extends Listing {
  nearby?: NearbyData;
  priceContext?: PriceContext | null;
  demographics?: DemographicsData | null;
}

export async function generateListingPdfBlob(input: PdfListingInput): Promise<Blob> {
  const body = {
    title: input.title,
    description: input.description,
    address: input.address,
    city: input.city,
    type: input.type,
    category: input.category,
    price: input.price,
    size: input.size,
    tags: input.tags || [],
    imageUrls: input.imageUrls || (input.imageUrl ? [input.imageUrl] : []),
    contact: input.contact,
    nearby: input.nearby,
    priceContext: input.priceContext,
    demographics: input.demographics,
  };

  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("PDF generation failed");
  }

  return res.blob();
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
