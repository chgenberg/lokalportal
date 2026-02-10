"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-navy/[0.06] flex items-center justify-center glow-light">
          <span className="text-2xl font-bold text-navy/60">!</span>
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2 tracking-tight">Något gick fel</h1>
        <p className="text-gray-500 mb-8 text-[15px] leading-relaxed">
          Ett oväntat fel inträffade. Försök ladda om sidan eller gå tillbaka till startsidan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="btn-glow px-6 py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
          >
            Försök igen
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-navy/20 text-navy rounded-xl text-sm font-medium hover:bg-navy/[0.03] transition-colors"
          >
            Till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}
