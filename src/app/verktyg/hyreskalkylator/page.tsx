import type { Metadata } from "next";
import HyreskalkylatorClient from "./HyreskalkylatorClient";

export const metadata: Metadata = {
  title: "Priskalkylator – Beräkna marknadsmässigt pris | Offmarket.nu",
  description: "Få en gratis uppskattning av marknadsmässigt pris för din bostad baserat på adress, kategori och storlek.",
};

export default function HyreskalkylatorPage() {
  return <HyreskalkylatorClient />;
}
