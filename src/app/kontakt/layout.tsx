import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakta oss – Offmarket.nu",
  description:
    "Kontakta Offmarket.nu med frågor om off-market bostäder, annonser eller support. Vi svarar vanligtvis inom 24 timmar.",
  openGraph: {
    title: "Kontakta oss – Offmarket.nu",
    description: "Skicka ett meddelande till Offmarket.nu. Vi hjälper dig gärna.",
  },
};

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
