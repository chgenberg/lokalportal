import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meddelanden – Hittayta.se",
  description:
    "Visa och hantera dina meddelanden på Hittayta.se. Kontakta hyresvärdar och hyresgäster direkt.",
};

export default function MeddelandenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
