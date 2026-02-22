"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "hittayta_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6 animate-slide-up">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Vi använder cookies för att webbplatsen ska fungera korrekt och för att förbättra din upplevelse.
          Läs mer i vår{" "}
          <Link href="/cookies" className="text-navy font-medium underline underline-offset-2">
            cookiepolicy
          </Link>.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={accept}
            className="px-5 py-2.5 bg-navy text-white text-sm font-medium rounded-full transition-all hover:shadow-md"
          >
            Acceptera alla
          </button>
          <button
            onClick={decline}
            className="px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full transition-all hover:bg-gray-200"
          >
            Endast nödvändiga
          </button>
        </div>
      </div>
    </div>
  );
}
