import type { Metadata } from "next";
import prisma from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return { title: "Annons hittades inte – Hittayta.se" };
  }
  const price =
    listing.type === "sale"
      ? `${(listing.price / 1000000).toFixed(1)} mkr`
      : `${listing.price.toLocaleString("sv-SE")} kr/mån`;
  const ogImages = listing.imageUrls?.length
    ? listing.imageUrls.slice(0, 3).map((url) => ({ url, width: 1200, height: 630, alt: listing.title }))
    : listing.imageUrl
      ? [{ url: listing.imageUrl, width: 1200, height: 630, alt: listing.title }]
      : [];

  return {
    title: `${listing.title} – Hittayta.se`,
    description: `${listing.address}, ${listing.city}. ${price}. ${listing.description.slice(0, 150)}...`,
    openGraph: {
      title: listing.title,
      description: `${listing.city} · ${price} · ${listing.size} m²`,
      ...(ogImages.length > 0 && { images: ogImages }),
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: `${listing.city} · ${price} · ${listing.size} m²`,
      ...(ogImages.length > 0 && { images: ogImages.map((img) => img.url) }),
    },
  };
}

export default function ListingIdLayout({ children }: { children: React.ReactNode }) {
  return children;
}
