import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Dashboard – Hittayta.se",
  description:
    "Hantera ditt konto på Hittayta.se. Översikt, annonser, meddelanden, favoriter och inställningar.",
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
