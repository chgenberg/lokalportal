import { MetadataRoute } from "next";
import prisma from "@/lib/db";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hittayta.se";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/annonser`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/kategorier`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/karta`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/annonspaket`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/sa-hyr-du-ut-en-lokal`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/om-oss`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/kontakt`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/logga-in`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/registrera`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/integritetspolicy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/villkor`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const listings = await prisma.listing.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const listingEntries: MetadataRoute.Sitemap = listings.map((l) => ({
      url: `${baseUrl}/annonser/${l.id}`,
      lastModified: l.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [...staticPages, ...listingEntries];
  } catch {
    return staticPages;
  }
}
