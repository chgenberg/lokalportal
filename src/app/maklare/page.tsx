"use client";

import { Suspense } from "react";
import MaklareDashboardClient from "./MaklareDashboardClient";

export default function MaklarePage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-2xl" /><div className="h-64 bg-muted rounded-2xl" /></div>}>
      <MaklareDashboardClient />
    </Suspense>
  );
}
