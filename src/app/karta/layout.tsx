import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karta – Hittayta.se",
  description:
    "Utforska kommersiella lokaler på kartan. Filtrera på typ, pris och plats för att hitta rätt lokal.",
};

export default function KartaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
