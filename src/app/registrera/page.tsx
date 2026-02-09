"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Building2, User, Loader2, Eye, EyeOff } from "lucide-react";

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

  const handleRoleSelect = (selectedRole: "landlord" | "tenant") => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("loading");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kunde inte skapa konto");
        setStep("details");
        return;
      }

      // Auto-login after registration
      await new Promise((resolve) => setTimeout(resolve, 1500)); // BankID simulation

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/logga-in");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Något gick fel. Försök igen.");
      setStep("details");
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-navy/5 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-navy border-t-transparent animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-3">
            Skapar ditt konto...
          </h1>
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
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-navy mb-2">
            Skapa konto
          </h1>
          <p className="text-sm text-gray-500">
            {step === "role"
              ? "Välj din kontotyp för att komma igång"
              : `Registrerar som ${role === "landlord" ? "hyresvärd" : "hyresgäst"}`}
          </p>
        </div>

        {step === "role" ? (
          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelect("landlord")}
              className="w-full p-6 rounded-2xl border border-border hover:border-accent hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">Hyresvärd</h3>
                  <p className="text-sm text-gray-500">
                    Publicera annonser, hantera lokaler och kommunicera med
                    potentiella hyresgäster
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect("tenant")}
              className="w-full p-6 rounded-2xl border border-border hover:border-accent hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center shrink-0 group-hover:bg-navy/20 transition-colors">
                  <User className="w-6 h-6 text-navy" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">Hyresgäst</h3>
                  <p className="text-sm text-gray-500">
                    Sök lokaler, spara favoriter och kontakta hyresvärdar
                    direkt
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep("role")}
              className="text-sm text-accent hover:underline mb-2"
            >
              &larr; Byt kontotyp
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Namn
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="Ditt fullständiga namn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-postadress
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="din@epost.se"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefon <span className="text-gray-400">(valfritt)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                placeholder="070-123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lösenord
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none pr-12"
                  placeholder="Minst 6 tecken"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors"
            >
              <Shield className="w-5 h-5" />
              Skapa konto med BankID
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Har redan ett konto?{" "}
            <Link
              href="/logga-in"
              className="text-accent font-medium hover:underline"
            >
              Logga in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
