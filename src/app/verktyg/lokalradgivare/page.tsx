import type { Metadata } from "next";
import LokalradgivareClient from "./LokalradgivareClient";

export const metadata: Metadata = {
  title: "Hitta rätt bostad – AI Bostadsrådgivare | Offmarket.nu",
  description: "Svara på några frågor om dina behov och få personliga rekommendationer på vilken typ av bostad som passar dig bäst.",
};

export default function LokalradgivarePage() {
  return <LokalradgivareClient />;
}
