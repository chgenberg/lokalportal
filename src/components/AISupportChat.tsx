"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import ContactModal from "./ContactModal";
import type { BookingData } from "./BookingCalendar";

const FAQ_QUESTIONS = [
  "Vad kostar det att annonsera?",
  "Hur fungerar annonspaketen?",
  "Vilka lokaler kan jag hitta?",
  "Hur kontaktar jag en hyresvärd?",
];

type Message = { role: "user" | "assistant"; content: string };

export default function AISupportChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          pagePath: pathname || "/",
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Något gick fel. Klicka på 'Jag vill bli kontaktad' så hjälper vi dig personligen." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Kunde inte skicka. Försök igen eller klicka på 'Jag vill bli kontaktad'." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmitted = (name: string, email: string) => {
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: `Tack ${name}! Vi kommer att kontakta dig via e-post på ${email} inom 24 timmar.`,
      },
    ]);
  };

  const handleCallbackSubmitted = (data: BookingData) => {
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: `Tack för din bokning! Vi ringer dig ${data.date} kl ${data.time}.`,
      },
    ]);
  };

  return (
    <>
      {/* Chat bubble */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex items-center gap-2 px-5 py-3 bg-navy text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
        aria-label="Öppna chatt"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white/90" />
        </span>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-sm font-semibold">Chatt</span>
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[150] w-[calc(100vw-2rem)] sm:w-[440px] h-[600px] sm:max-h-[min(600px,calc(100vh-6rem))] flex flex-col bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex-shrink-0 bg-navy text-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Hittayta.se</h3>
                <p className="text-[12px] text-white/70">Vi svarar direkt!</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Stäng chatt"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-[13px] text-gray-500 mb-4">Hej! Ställ frågor om kommersiella lokaler och Hittayta.se.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {FAQ_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 rounded-full bg-white border border-border/60 text-[12px] text-navy hover:border-navy/30 hover:bg-navy/[0.02] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-navy text-white rounded-br-md"
                      : "bg-white text-navy border border-border/60 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-border/60">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-navy/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-navy/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-navy/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 pt-2 border-t border-border/60 bg-white space-y-3">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-gold/60 bg-gold/10 text-navy text-[13px] font-semibold hover:bg-gold/20 hover:border-gold transition-colors"
            >
              Jag vill bli kontaktad
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Skriv din fråga..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border/60 focus:border-navy/40 focus:outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy-light transition-colors"
              >
                Skicka
              </button>
            </div>
          </div>
        </div>
      )}

      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        onEmailSubmitted={handleEmailSubmitted}
        onCallbackSubmitted={handleCallbackSubmitted}
      />
    </>
  );
}
