import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alla annonser – Hittayta.se",
  description:
    "Utforska kommersiella lokaler till salu och uthyrning. Butiker, kontor, lager och mer i hela Sverige.",
  openGraph: {
    title: "Alla annonser – Hittayta.se",
    description: "Utforska kommersiella lokaler till salu och uthyrning i hela Sverige.",
  },
};

export default function AnnonserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
