import type { Metadata } from "next";
import OmOssClient from "./OmOssClient";

export const metadata: Metadata = {
  title: "Om oss – Offmarket.nu",
  description: "Möt Thomas Claesson och teamet bakom Offmarket.nu – Sveriges modernaste marknadsplats för off-market bostäder.",
};

export default function OmOssPage() {
  return <OmOssClient />;
}
