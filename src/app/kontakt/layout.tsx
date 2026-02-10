import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakta oss – Hittayta.se",
  description:
    "Kontakta Hittayta.se med frågor om kommersiella lokaler, annonser eller support. Vi svarar vanligtvis inom 24 timmar.",
  openGraph: {
    title: "Kontakta oss – Hittayta.se",
    description: "Skicka ett meddelande till Hittayta.se. Vi hjälper dig gärna.",
  },
};

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
