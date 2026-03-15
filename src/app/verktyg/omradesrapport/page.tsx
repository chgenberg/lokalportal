import type { Metadata } from "next";
import OmradesrapportClient from "./OmradesrapportClient";

export const metadata: Metadata = {
  title: "Områdesrapport – Analysera ditt område | Offmarket.nu",
  description: "Få en gratis områdesrapport med demografi, köpkraft, konkurrenter, kollektivtrafik och brottsstatistik för valfri adress i Sverige.",
};

export default function OmradesrapportPage() {
  return <OmradesrapportClient />;
}
