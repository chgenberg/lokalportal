import { Suspense } from "react";
import SkapaAnnonsClient from "./SkapaAnnonsClient";

export const metadata = {
  title: "Skapa annons | HittaYta.se",
  description: "Generera en professionell annonstext med vår agent. Ladda ner som PDF eller publicera direkt på HittaYta.se.",
};

export default function SkapaAnnonsPage() {
  return (
    <Suspense>
      <SkapaAnnonsClient />
    </Suspense>
  );
}
