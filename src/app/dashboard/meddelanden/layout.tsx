import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meddelanden – Offmarket.nu",
  description:
    "Visa och hantera dina meddelanden på Offmarket.nu. Kontakta säljare och köpare direkt.",
};

export default function MeddelandenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
