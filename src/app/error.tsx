"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-navy mb-2">Något gick fel</h1>
        <p className="text-gray-500 mb-8">
          Ett oväntat fel inträffade. Försök ladda om sidan eller gå tillbaka till startsidan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Försök igen
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-navy text-navy rounded-xl text-sm font-medium hover:bg-navy/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            Till startsidan
          </Link>
        </div>
      </div>
    </div>
  );
}
