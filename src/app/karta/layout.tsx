import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karta – Offmarket.nu",
  description:
    "Utforska off-market bostäder på kartan. Filtrera på typ, pris och plats för att hitta rätt bostad.",
};

export default function KartaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
