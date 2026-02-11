import type { Metadata } from "next";
import OmOssClient from "./OmOssClient";

export const metadata: Metadata = {
  title: "Om oss – Hittayta.se",
  description: "Möt Thomas Claesson och teamet bakom Hittayta.se – Sveriges modernaste marknadsplats för kommersiella lokaler.",
};

export default function OmOssPage() {
  return <OmOssClient />;
}
