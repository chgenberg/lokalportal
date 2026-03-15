import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alla annonser – Offmarket.nu",
  description:
    "Utforska off-market bostäder till salu. Villor, lägenheter, fritidshus och tomter i hela Sverige – innan de når den öppna marknaden.",
  openGraph: {
    title: "Alla annonser – Offmarket.nu",
    description: "Utforska off-market bostäder till salu i hela Sverige.",
  },
};

export default function AnnonserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
