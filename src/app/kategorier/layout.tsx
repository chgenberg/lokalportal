import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategorier – Offmarket.nu",
  description:
    "Utforska bostadskategorier: villor, lägenheter, fritidshus och tomter. Hitta off-market bostäder i Sverige.",
  openGraph: {
    title: "Kategorier – Offmarket.nu",
    description: "Utforska bostadskategorier för off-market bostäder i Sverige.",
  },
};

export default function KategorierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
