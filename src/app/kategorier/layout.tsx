import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategorier – Hittayta.se",
  description:
    "Utforska lokalkategorier: butikslokaler, kontor, lager och övriga kommersiella lokaler.",
  openGraph: {
    title: "Kategorier – Hittayta.se",
    description: "Utforska lokalkategorier för kommersiella lokaler i Sverige.",
  },
};

export default function KategorierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
