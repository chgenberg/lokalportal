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
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-navy/[0.03] flex items-center justify-center glow">
            <div className="w-12 h-12 rounded-full border-2 border-navy/20 border-t-navy animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-navy mb-2 tracking-tight">Startar BankID...</h1>
          <p className="text-[13px] text-gray-400">Öppna BankID-appen på din enhet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-navy flex items-center justify-center glow-strong">
            <span className="text-lg font-bold text-white">H</span>
          </div>
          <h1 className="text-xl font-bold text-navy mb-1.5 tracking-tight">Logga in</h1>
          <p className="text-[13px] text-gray-400">Verifiera din identitet för att fortsätta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-navy/[0.03] border border-navy/10 rounded-xl text-[13px] text-navy">{error}</div>}

          <div>
            <label className="block text-[12px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">E-postadress</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} required className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" placeholder="din@epost.se" />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">Lösenord</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} required className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all pr-14" placeholder="Ditt lösenord" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-300 hover:text-gray-500 transition-colors tracking-wide uppercase">
                {showPassword ? "Dölj" : "Visa"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-glow w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl disabled:opacity-50 tracking-wide">
            Logga in
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400">Inget konto? <Link href="/registrera" className="text-navy font-semibold hover:underline">Registrera dig</Link></p>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40">
          <p className="text-[11px] text-gray-300 text-center leading-relaxed">
            Genom att logga in godkänner du våra <Link href="/villkor" className="text-navy/60 hover:underline">villkor</Link> och <Link href="/integritetspolicy" className="text-navy/60 hover:underline">integritetspolicy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-300 text-sm">Laddar...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
