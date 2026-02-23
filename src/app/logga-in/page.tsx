"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

type LoginAs = "landlord" | "tenant" | "agent";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback") || "/dashboard";

  const [loginAs, setLoginAs] = useState<LoginAs | null>(null);
  const [step, setStep] = useState<"form" | "loading" | "error">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setStep("loading");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setStep("error"); setSubmitting(false); setError("Felaktig e-post eller lösenord"); }
    else { router.push(callbackUrl); router.refresh(); }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-navy/[0.03] border border-navy/10 shadow-sm flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-navy/20 border-t-navy animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-navy mb-2 tracking-tight">Loggar in...</h1>
          <p className="text-[13px] text-gray-400">Vänta medan vi verifierar dina uppgifter</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout title="Logga in" subtitle="Ett konto för både att hyra ut och söka lokaler – samma inloggning oavsett roll.">
        <div className="space-y-6">
          <div>
            <p className="text-[12px] font-semibold text-gray-400 mb-3 tracking-wide uppercase">Vad vill du göra idag?</p>
            <p className="text-[11px] text-gray-400 mb-3">Välj vad du vill prioritera – du får tillgång till allt med samma konto.</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setLoginAs("landlord")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  loginAs === "landlord"
                    ? "border-navy bg-navy/[0.04] shadow-sm"
                    : "border-border/60 hover:border-navy/30 bg-white"
                }`}
              >
                <span className="block text-[13px] font-semibold text-navy">Hyresvärd / säljare</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">Publicera annonser</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginAs("tenant")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  loginAs === "tenant"
                    ? "border-navy bg-navy/[0.04] shadow-sm"
                    : "border-border/60 hover:border-navy/30 bg-white"
                }`}
              >
                <span className="block text-[13px] font-semibold text-navy">Hyresgäst / köpare</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">Sök och kontakta lokaler</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginAs("agent")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  loginAs === "agent"
                    ? "border-navy bg-navy/[0.04] shadow-sm"
                    : "border-border/60 hover:border-navy/30 bg-white"
                }`}
              >
                <span className="block text-[13px] font-semibold text-navy">Mäklare</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">Hantera klienter & portfölj</span>
              </button>
            </div>
            {loginAs && (
              <p className="text-[11px] text-gray-400 mt-2">
                {loginAs === "landlord"
                  ? "Du kommer till din annons- och statistikdashboard efter inloggning."
                  : loginAs === "agent"
                    ? "Du kommer till din mäklardashboard med klienter och portfölj."
                    : "Du kommer till dina sparade annonser och meddelanden efter inloggning."}
              </p>
            )}
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div role="alert" className="p-3 bg-navy/[0.03] border border-navy/10 rounded-xl text-[13px] text-navy">{error}</div>}

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

          <button type="submit" disabled={submitting} className="w-full py-3.5 bg-gold text-navy text-[13px] font-semibold rounded-xl disabled:opacity-50 tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
            Logga in
          </button>
        </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400">Inget konto? <Link href={callbackUrl !== "/dashboard" ? `/registrera?callback=${encodeURIComponent(callbackUrl)}` : "/registrera"} className="text-navy font-semibold hover:underline">Registrera dig</Link></p>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40">
          <p className="text-[11px] text-gray-300 text-center leading-relaxed">
            Genom att logga in godkänner du våra <Link href="/villkor" className="text-navy/60 hover:underline">villkor</Link> och <Link href="/integritetspolicy" className="text-navy/60 hover:underline">integritetspolicy</Link>
          </p>
        </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-300 text-sm">Laddar...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
