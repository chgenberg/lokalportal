"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details" | "loading">("role");
  const [role, setRole] = useState<"landlord" | "tenant" | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (selectedRole: "landlord" | "tenant") => { setRole(selectedRole); setStep("details"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("loading");

    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name, role, phone }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Kunde inte skapa konto"); setStep("details"); return; }

      await new Promise((resolve) => setTimeout(resolve, 1500));
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { router.push("/logga-in"); } else { router.push("/dashboard"); router.refresh(); }
    } catch { setError("Något gick fel. Försök igen."); setStep("details"); }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-navy/5 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-navy border-t-transparent animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-3">Skapar ditt konto...</h1>
          <p className="text-gray-500">Verifierar med BankID</p>
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
          <h1 className="text-2xl font-bold text-navy mb-2">Skapa konto</h1>
          <p className="text-sm text-gray-500">
            {step === "role" ? "Välj din kontotyp för att komma igång" : `Registrerar som ${role === "landlord" ? "hyresvärd" : "hyresgäst"}`}
          </p>
        </div>

        {step === "role" ? (
          <div className="space-y-4">
            <button onClick={() => handleRoleSelect("landlord")} className="w-full p-6 rounded-2xl border border-border hover:border-navy/30 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                  <span className="text-lg font-bold text-navy group-hover:text-white transition-colors">H</span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">Hyresvärd</h3>
                  <p className="text-sm text-gray-500">Publicera annonser, hantera lokaler och kommunicera med potentiella hyresgäster</p>
                </div>
              </div>
            </button>

            <button onClick={() => handleRoleSelect("tenant")} className="w-full p-6 rounded-2xl border border-border hover:border-navy/30 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                  <span className="text-lg font-bold text-navy group-hover:text-white transition-colors">G</span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">Hyresgäst</h3>
                  <p className="text-sm text-gray-500">Sök lokaler, spara favoriter och kontakta hyresvärdar direkt</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-navy/5 border border-navy/10 rounded-xl text-sm text-navy">{error}</div>}

            <button type="button" onClick={() => setStep("role")} className="text-sm text-navy hover:underline mb-2">&larr; Byt kontotyp</button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Namn</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" placeholder="Ditt fullständiga namn" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-postadress</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" placeholder="din@epost.se" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon <span className="text-gray-400">(valfritt)</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" placeholder="070-123 45 67" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lösenord</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none pr-12" placeholder="Minst 6 tecken" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? "Dölj" : "Visa"}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors">Skapa konto med BankID</button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">Har redan ett konto? <Link href="/logga-in" className="text-navy font-medium hover:underline">Logga in</Link></p>
        </div>
      </div>
    </div>
  );
}
