import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrera konto – Hittayta.se",
  description:
    "Skapa ett konto på Hittayta.se för att annonsera lokaler eller spara favoriter. Registrering är gratis.",
  robots: { index: false, follow: false },
};

export default function RegistreraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
