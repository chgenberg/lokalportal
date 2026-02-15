"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback") || "/dashboard";
  const [step, setStep] = useState<"role" | "details" | "loading">("role");
  const [role, setRole] = useState<"landlord" | "tenant" | "agent" | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (selectedRole: "landlord" | "tenant" | "agent") => { setRole(selectedRole); setStep("details"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("loading");
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name, role, phone }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Kunde inte skapa konto"); setStep("details"); return; }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { router.push("/logga-in"); } else { router.push(callbackUrl); router.refresh(); }
    } catch { setError("Något gick fel. Försök igen."); setStep("details"); }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-navy/[0.03] border border-navy/10 shadow-sm flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-navy/20 border-t-navy animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-navy mb-2 tracking-tight">Skapar ditt konto...</h1>
          <p className="text-[13px] text-gray-400">Vänta medan kontot skapas...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Skapa konto"
      subtitle={step === "role" ? "Välj din kontotyp" : `Registrerar som ${role === "landlord" ? "hyresvärd / säljare" : role === "agent" ? "mäklare" : "hyresgäst / köpare"}`}
    >
        {step === "role" ? (
          <div className="space-y-3">
            <button onClick={() => handleRoleSelect("landlord")} className="w-full p-6 rounded-2xl border border-border/60 text-left group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-navy/[0.04] flex items-center justify-center shrink-0 group-hover:bg-navy transition-all duration-300">
                  <span className="text-[13px] font-bold text-navy group-hover:text-white transition-colors">H</span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1 tracking-tight">Hyresvärd / säljare</h3>
                  <p className="text-[12px] text-gray-400 leading-relaxed">Publicera annonser och kommunicera med hyresgäster</p>
                </div>
              </div>
            </button>

            <button onClick={() => handleRoleSelect("agent")} className="w-full p-6 rounded-2xl border border-border/60 text-left group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-navy/[0.04] flex items-center justify-center shrink-0 group-hover:bg-navy transition-all duration-300">
                  <span className="text-[13px] font-bold text-navy group-hover:text-white transition-colors">M</span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1 tracking-tight">Mäklare</h3>
                  <p className="text-[12px] text-gray-400 leading-relaxed">Publicera annonser med din logotyp och profilera dina lokaler</p>
                </div>
              </div>
            </button>

            <button onClick={() => handleRoleSelect("tenant")} className="w-full p-6 rounded-2xl border border-border/60 text-left group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-navy/[0.04] flex items-center justify-center shrink-0 group-hover:bg-navy transition-all duration-300">
                  <span className="text-[13px] font-bold text-navy group-hover:text-white transition-colors">G</span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1 tracking-tight">Hyresgäst / köpare</h3>
                  <p className="text-[12px] text-gray-400 leading-relaxed">Sök lokaler, spara favoriter och kontakta hyresvärdar</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div role="alert" className="p-3 bg-navy/[0.03] border border-navy/10 rounded-xl text-[13px] text-navy">{error}</div>}

            <button type="button" onClick={() => setStep("role")} className="text-[12px] font-semibold text-navy/50 hover:text-navy transition-colors mb-1">&larr; Byt kontotyp</button>

            <div>
              <label className="block text-[12px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">Namn</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" placeholder="Ditt fullständiga namn" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">E-postadress</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" placeholder="din@epost.se" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">Telefon <span className="text-gray-300 normal-case">(valfritt)</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" placeholder="070-123 45 67" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">Lösenord</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all pr-14" placeholder="Minst 6 tecken" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-300 hover:text-gray-500 transition-colors tracking-wide uppercase">
                  {showPassword ? "Dölj" : "Visa"}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">Skapa konto</button>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400">Har redan ett konto? <Link href={callbackUrl !== "/dashboard" ? `/logga-in?callback=${encodeURIComponent(callbackUrl)}` : "/logga-in"} className="text-navy font-semibold hover:underline">Logga in</Link></p>
        </div>
    </AuthLayout>
  );
}
