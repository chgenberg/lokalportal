import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard – Offmarket.nu",
  description:
    "Hantera ditt konto på Offmarket.nu. Översikt, annonser, meddelanden, favoriter och inställningar.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted" />}>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </Suspense>
  );
}
