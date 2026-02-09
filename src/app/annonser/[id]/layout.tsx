import type { Metadata } from "next";
import { getListingById } from "@/lib/redis";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) {
    return { title: "Annons hittades inte – Lokalportal" };
  }
  const price =
    listing.type === "sale"
      ? `${(listing.price / 1000000).toFixed(1)} mkr`
      : `${listing.price.toLocaleString("sv-SE")} kr/mån`;
  return {
    title: `${listing.title} – Lokalportal`,
    description: `${listing.address}, ${listing.city}. ${price}. ${listing.description.slice(0, 150)}...`,
    openGraph: {
      title: listing.title,
      description: `${listing.city} · ${price} · ${listing.size} m²`,
    },
  };
}

export default function ListingIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
