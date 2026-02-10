import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logga in – Hittayta.se",
  description:
    "Logga in på ditt Hittayta.se-konto för att hantera annonser, meddelanden och inställningar.",
  robots: { index: false, follow: false },
};

export default function LoggaInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
