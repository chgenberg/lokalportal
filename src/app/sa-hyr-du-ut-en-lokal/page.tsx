import type { Metadata } from "next";
import SaHyrDuUtClient from "./SaHyrDuUtClient";

export const metadata: Metadata = {
  title: "Så hyr du ut en lokal – Hittayta.se",
  description:
    "Steg-för-steg guide för att hyra ut kommersiella lokaler. Från planering och marknadsföring till kontrakt och tillträde.",
};

export default function SaHyrDuUtPage() {
  return <SaHyrDuUtClient />;
}
