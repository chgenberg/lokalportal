import { Suspense } from "react";
import SkapaAnnonsClient from "./SkapaAnnonsClient";

export const metadata = {
  title: "Skapa annons | Offmarket.nu",
  description: "Generera en professionell annonstext med vår agent. Ladda ner som PDF eller publicera direkt på Offmarket.nu.",
};

export default function SkapaAnnonsPage() {
  return (
    <Suspense>
      <SkapaAnnonsClient />
    </Suspense>
  );
}
