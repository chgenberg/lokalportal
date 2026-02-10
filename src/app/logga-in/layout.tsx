import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logga in – Hittayta.se",
  description:
    "Logga in på ditt Hittayta.se-konto för att hantera annonser, meddelanden och inställningar.",
};

export default function LoggaInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
