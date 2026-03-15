import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logga in – Offmarket.nu",
  description:
    "Logga in på ditt Offmarket.nu-konto för att hantera annonser, meddelanden och inställningar.",
  robots: { index: false, follow: false },
};

export default function LoggaInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
