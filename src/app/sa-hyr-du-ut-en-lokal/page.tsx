import type { Metadata } from "next";
import SaHyrDuUtClient from "./SaHyrDuUtClient";

export const metadata: Metadata = {
  title: "Så fungerar det – Offmarket | Sälj och köp off-market bostäder",
  description:
    "Steg-för-steg guide för att sälja eller köpa bostäder off-market. Från annonsering och matchning till köpekontrakt och tillträde.",
};

export default function SaHyrDuUtPage() {
  return <SaHyrDuUtClient />;
}
