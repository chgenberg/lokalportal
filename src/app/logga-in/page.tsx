"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback") || "/dashboard";

  const [step, setStep] = useState<"form" | "bankid" | "error">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setStep("bankid");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) { setStep("error"); setSubmitting(false); setError("Felaktig e-post eller lösenord"); }
    else { router.push(callbackUrl); router.refresh(); }
  };

  if (step === "bankid") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-navy/5 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-navy border-t-transparent animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-3">Startar BankID...</h1>
          <p className="text-gray-500 mb-2">Öppna BankID-appen på din enhet</p>
          <p className="text-xs text-gray-400">Väntar på verifiering...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-navy flex items-center justify-center">
            <span className="text-xl font-bold text-white">L</span>
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">Logga in med BankID</h1>
          <p className="text-sm text-gray-500">Verifiera din identitet för att fortsätta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-navy/5 border border-navy/10 rounded-xl text-sm text-navy">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-postadress</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none transition-colors" placeholder="din@epost.se" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lösenord</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none transition-colors pr-12" placeholder="Ditt lösenord" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {showPassword ? "Dölj" : "Visa"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50">
            Logga in med BankID
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Inget konto? <Link href="/registrera" className="text-navy font-medium hover:underline">Registrera dig</Link></p>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-gray-400 text-center">
            Genom att logga in godkänner du våra <Link href="/villkor" className="text-navy hover:underline">villkor</Link> och <Link href="/integritetspolicy" className="text-navy hover:underline">integritetspolicy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-400">Laddar...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
