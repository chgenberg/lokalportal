import { Suspense } from "react";
import PubliceraClient from "./PubliceraClient";

export const metadata = {
  title: "Publicera annons | Offmarket.nu",
  description: "Publicera din annons på Offmarket.nu",
};

export default function PubliceraPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" /></div>}>
      <PubliceraClient />
    </Suspense>
  );
}
