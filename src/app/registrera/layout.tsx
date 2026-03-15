import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrera konto – Offmarket.nu",
  description:
    "Skapa ett konto på Offmarket.nu för att annonsera bostäder eller spara favoriter. Registrering är gratis.",
  robots: { index: false, follow: false },
};

export default function RegistreraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
