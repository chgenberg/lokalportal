import type { Metadata } from "next";
import { Suspense } from "react";
import MaklareLayoutClient from "./MaklareLayoutClient";

export const metadata: Metadata = {
  title: "Mäklare – Hittayta.se",
  description: "Mäklare-dashboard för att hantera klienter, portfölj och statistik.",
  robots: { index: false, follow: false },
};

export default function MaklareLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted" />}>
      <MaklareLayoutClient>{children}</MaklareLayoutClient>
    </Suspense>
  );
}
