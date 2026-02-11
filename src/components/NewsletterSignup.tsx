"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "newsletter" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Något gick fel.");
      }
    } catch {
      setStatus("error");
      setMessage("Något gick fel. Försök igen.");
    }
  };

  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/20">Prenumerera</h4>
      <p className="text-[13px] text-white/40 mb-3">Få tips och nyheter om kommersiella lokaler.</p>
      {status === "success" ? (
        <p className="text-[13px] text-white/80">Tack! Du är nu prenumerant.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-post"
            className="px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/40 text-[13px] focus:outline-none focus:border-white/30"
            required
            disabled={status === "loading"}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-4 py-2.5 rounded-lg bg-white/15 text-white text-[13px] font-medium hover:bg-white/25 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {status === "loading" ? "Skickar..." : "Prenumerera"}
          </button>
        </form>
      )}
      {status === "error" && message && (
        <p className="text-[12px] text-red-300 mt-2">{message}</p>
      )}
    </div>
  );
}
