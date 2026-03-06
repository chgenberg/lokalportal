import type { Metadata } from "next";
import HyreskalkylatorClient from "./HyreskalkylatorClient";

export const metadata: Metadata = {
  title: "Hyreskalkylator – Beräkna marknadsmässig hyra | HittaYta.se",
  description: "Få en gratis uppskattning av marknadsmässig hyra för din kommersiella lokal baserat på adress, kategori och storlek.",
};

export default function HyreskalkylatorPage() {
  return <HyreskalkylatorClient />;
}
