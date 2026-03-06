import type { Metadata } from "next";
import LokalradgivareClient from "./LokalradgivareClient";

export const metadata: Metadata = {
  title: "Hitta rätt lokal – AI Lokalrådgivare | HittaYta.se",
  description: "Svara på några frågor om din verksamhet och få personliga rekommendationer på vilken typ av lokal som passar dig bäst.",
};

export default function LokalradgivarePage() {
  return <LokalradgivareClient />;
}
