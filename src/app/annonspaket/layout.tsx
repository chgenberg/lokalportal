import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Annonspaket – Hittayta.se",
  description:
    "Välj annonspaket för att hyra ut din lokal. Logga in med BankID och nå tusentals potentiella hyresgäster.",
  openGraph: {
    title: "Annonspaket – Hittayta.se",
    description: "Annonsera din lokal hos Hittayta.se. Säkert med BankID.",
  },
};

export default function AnnonspaketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
